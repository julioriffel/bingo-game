import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from ..services.room_service import room_service
from ..services.connection_manager import connection_manager
from ..models.room import WinCondition, DrawMode

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/rooms", tags=["rooms"])

class PrizeInput(BaseModel):
    title: str
    description: str = ""
    target_type: Optional[str] = Field(default=None, pattern="^(line|blackout)$")

class CreateRoomRequest(BaseModel):
    host_name: str
    name: str = ""
    win_condition: WinCondition = WinCondition.MULTI_STAGE
    max_cards_per_player: int = Field(default=4, ge=1, le=4)
    is_public: bool = True
    draw_interval: float = Field(default=5.0, ge=2.0, le=60.0)
    draw_mode: DrawMode = DrawMode.AUTO
    contest_window_seconds: float = Field(default=10.0, ge=0.0, le=120.0)
    prizes: list[PrizeInput] = Field(default_factory=list)
    previous_room_code: Optional[str] = None

class StartNewGameRequest(BaseModel):
    host_id: str
    name: Optional[str] = None
    win_condition: Optional[WinCondition] = None
    max_cards_per_player: Optional[int] = None
    draw_interval: Optional[float] = None
    draw_mode: Optional[DrawMode] = None
    contest_window_seconds: Optional[float] = None
    prizes: Optional[list[PrizeInput]] = None

class JoinRoomRequest(BaseModel):
    player_name: str
    card_count: int = Field(default=1, ge=1, le=4)
    token: Optional[str] = None
    pin: Optional[str] = None

class AddPrizeRequest(BaseModel):
    host_id: str
    title: str
    description: str = ""
    target_type: str = Field(default="line", pattern="^(line|blackout)$")

class UpdatePrizeRequest(BaseModel):
    host_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    target_type: Optional[str] = Field(default=None, pattern="^(line|blackout)$")

@router.get("")
async def list_public_rooms():
    return {"rooms": await room_service.get_public_rooms_async()}

@router.get("/{room_code}")
async def get_room(room_code: str):
    room = await room_service.get_room_async(room_code.upper())
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")
    return {
        "code": room.code,
        "name": room.name,
        "host_id": room.host_id,
        "host_name": room.host_name,
        "status": room.status.value,
        "stage": room.stage.value,
        "win_condition": room.win_condition.value,
        "draw_mode": room.draw_mode.value,
        "draw_interval": room.draw_interval,
        "contest_window_seconds": room.contest_window_seconds,
        "active_contest": room.active_contest.model_dump() if room.active_contest else None,
        "drawn_balls": room.drawn_balls,
        "last_drawn_ball": room.last_drawn_ball,
        "player_count": room.get_player_count(),
        "manager_last_active_at": room.manager_last_active_at,
        "manager_inactive": room.is_manager_inactive(),
        "users": room.get_connected_users_list(),
        "winners": [w.model_dump() for w in room.winners],
        "prizes": [p.model_dump() for p in room.prizes],
        "game_log": [e.model_dump() for e in room.game_log],
    }

@router.get("/{room_code}/users")
async def get_room_users(room_code: str):
    room = await room_service.get_room_async(room_code.upper())
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")
    return {
        "room_code": room.code,
        "host_id": room.host_id,
        "host_name": room.host_name,
        "manager_last_active_at": room.manager_last_active_at,
        "manager_inactive": room.is_manager_inactive(),
        "player_count": room.get_player_count(),
        "users": room.get_connected_users_list(),
    }

class ClaimManagerRequest(BaseModel):
    player_id: str

@router.post("/{room_code}/claim-manager")
async def claim_manager_endpoint(room_code: str, req: ClaimManagerRequest):
    code = room_code.upper()
    try:
        room, new_mgr = await room_service.claim_manager(code, req.player_id)
        return {
            "success": True,
            "host_id": new_mgr.id,
            "host_name": new_mgr.name,
            "token": new_mgr.token,
            "player_count": room.get_player_count(),
        }
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PermissionError as err:
        raise HTTPException(status_code=403, detail=str(err))
    except Exception as e:
        logger.exception("Erro inesperado em claim-manager", extra={"room_code": code})
        raise HTTPException(status_code=500, detail="Erro interno ao assumir gerenciamento da sala")

@router.get("/{room_code}/log")
async def get_room_log(room_code: str):
    room = await room_service.get_room_async(room_code.upper())
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")
    return {
        "room_code": room.code,
        "total_drawn": len(room.drawn_balls),
        "total_winners": len(room.winners),
        "game_log": [e.model_dump() for e in room.game_log],
    }

@router.post("")
async def create_room(req: CreateRoomRequest):
    try:
        room, host_player = room_service.create_room(
            host_name=req.host_name.strip() or "Host",
            name=req.name.strip(),
            win_condition=req.win_condition,
            max_cards_per_player=req.max_cards_per_player,
            is_public=req.is_public,
            draw_interval=req.draw_interval,
            draw_mode=req.draw_mode,
            prizes=[p.model_dump() for p in req.prizes],
            contest_window_seconds=req.contest_window_seconds,
        )

        # If created as continuation of a previous match, redirect previous room's players
        if req.previous_room_code:
            old_code = req.previous_room_code.strip().upper()
            await connection_manager.broadcast_to_room(old_code, {
                "type": "new_game_redirect",
                "payload": {
                    "new_room_code": room.code,
                    "room_name": room.name,
                    "pin": room.pin,
                    "host_name": room.host_name,
                    "message": f"O Anfitrião iniciou uma nova partida na sala {room.code}!",
                }
            })

        return {
            "room_code": room.code,
            "pin": room.pin,
            "host_id": host_player.id,
            "token": host_player.token,
        }
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        logger.exception("Erro inesperado ao criar sala")
        raise HTTPException(status_code=500, detail="Erro interno ao criar sala")

@router.post("/{room_code}/new-game")
async def start_new_game(room_code: str, req: StartNewGameRequest):
    code = room_code.upper()
    try:
        prizes_data = [p.model_dump() for p in req.prizes] if req.prizes is not None else None
        new_room, new_host = await room_service.create_next_game(
            old_room_code=code,
            host_id=req.host_id,
            name=req.name.strip() if req.name else None,
            prizes=prizes_data,
            win_condition=req.win_condition,
            max_cards_per_player=req.max_cards_per_player,
            draw_interval=req.draw_interval,
            draw_mode=req.draw_mode,
            contest_window_seconds=req.contest_window_seconds,
        )
        return {
            "success": True,
            "room_code": new_room.code,
            "pin": new_room.pin,
            "host_id": new_host.id,
            "token": new_host.token,
            "prizes": [p.model_dump() for p in new_room.prizes],
            "draw_interval": new_room.draw_interval,
            "draw_mode": new_room.draw_mode.value,
            "win_condition": new_room.win_condition.value,
        }
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PermissionError as err:
        raise HTTPException(status_code=403, detail=str(err))
    except Exception as err:
        logger.exception("Erro ao iniciar nova partida da sala %s", code)
        raise HTTPException(status_code=500, detail="Erro interno ao iniciar nova partida")

@router.post("/{room_code}/join")
async def join_room(room_code: str, req: JoinRoomRequest):
    code = room_code.upper()
    room = await room_service.get_room_async(code)
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")

    # Strict PIN verification for private rooms
    if not room.is_public:
        if not req.pin or req.pin.strip() != room.pin:
            raise HTTPException(status_code=403, detail="Esta sala é privada. PIN de acesso obrigatório e incorreto.")

    try:
        room, player = await room_service.join_room_async(
            room_code=code,
            player_name=req.player_name.strip() or "Jogador",
            card_count=req.card_count,
            token=req.token,
        )
        return {
            "room_code": room.code,
            "player_id": player.id,
            "player_name": player.name,
            "token": player.token,
            "is_host": player.is_host,
            "cards": [c.model_dump() for c in player.cards],
            "room_state": room.status.value,
            "prizes": [p.model_dump() for p in room.prizes],
        }
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PermissionError as err:
        raise HTTPException(status_code=403, detail=str(err))
    except Exception as e:
        logger.exception("Erro inesperado ao ingressar na sala", extra={"room_code": code})
        raise HTTPException(status_code=500, detail="Erro interno ao ingressar na sala")

@router.get("/{room_code}/players/{player_id}/cards")
async def get_player_cards(room_code: str, player_id: str, token: Optional[str] = None):
    code = room_code.upper()
    room = await room_service.get_room_async(code)
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")
    player = room.players.get(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    if token and player.token != token:
        raise HTTPException(status_code=403, detail="Token inválido para esta cartela")
    return {
        "room_code": room.code,
        "player_id": player.id,
        "cards": [c.model_dump() for c in player.cards],
    }

@router.post("/{room_code}/prizes")
async def add_prize(room_code: str, req: AddPrizeRequest):
    code = room_code.upper()
    try:
        prize = await room_service.add_prize(code, req.host_id, req.title, req.description, req.target_type)
        return {"success": True, "prize": prize.model_dump()}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PermissionError as err:
        raise HTTPException(status_code=403, detail=str(err))
    except Exception as e:
        logger.exception("Erro ao adicionar prêmio", extra={"room_code": code})
        raise HTTPException(status_code=500, detail="Erro interno ao adicionar prêmio")

@router.patch("/{room_code}/prizes/{prize_id}")
async def update_prize_endpoint(room_code: str, prize_id: str, req: UpdatePrizeRequest):
    code = room_code.upper()
    try:
        prize = await room_service.update_prize(
            code, req.host_id, prize_id, req.title, req.description, req.target_type
        )
        return {"success": True, "prize": prize.model_dump()}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PermissionError as err:
        raise HTTPException(status_code=403, detail=str(err))
    except Exception as e:
        logger.exception("Erro ao atualizar prêmio", extra={"room_code": code})
        raise HTTPException(status_code=500, detail="Erro interno ao atualizar prêmio")

@router.delete("/{room_code}/prizes/{prize_id}")
async def delete_prize(room_code: str, prize_id: str, host_id: str):
    code = room_code.upper()
    try:
        await room_service.remove_prize(code, host_id, prize_id)
        return {"success": True}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PermissionError as err:
        raise HTTPException(status_code=403, detail=str(err))
    except Exception as e:
        logger.exception("Erro ao remover prêmio", extra={"room_code": code})
        raise HTTPException(status_code=500, detail="Erro interno ao remover prêmio")
