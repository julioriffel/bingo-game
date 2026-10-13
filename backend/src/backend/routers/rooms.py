from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from ..services.room_service import room_service
from ..models.room import WinCondition, DrawMode

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

class PrizeInput(BaseModel):
    title: str
    description: str = ""

class CreateRoomRequest(BaseModel):
    host_name: str
    name: str = ""
    win_condition: WinCondition = WinCondition.MULTI_STAGE
    max_cards_per_player: int = Field(default=4, ge=1, le=4)
    is_public: bool = True
    draw_interval: float = Field(default=5.0, ge=2.0, le=20.0)
    draw_mode: DrawMode = DrawMode.AUTO
    contest_window_seconds: float = Field(default=10.0, ge=0.0, le=30.0)
    prizes: list[PrizeInput] = Field(default_factory=list)

class JoinRoomRequest(BaseModel):
    player_name: str
    card_count: int = Field(default=1, ge=1, le=4)
    token: Optional[str] = None
    pin: Optional[str] = None

class AddPrizeRequest(BaseModel):
    host_id: str
    title: str
    description: str = ""

@router.get("")
def list_public_rooms():
    return {"rooms": room_service.get_public_rooms()}

@router.get("/{room_code}")
def get_room(room_code: str):
    room = room_service.get_room(room_code.upper())
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
def get_room_users(room_code: str):
    room = room_service.get_room(room_code.upper())
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
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{room_code}/log")
def get_room_log(room_code: str):
    room = room_service.get_room(room_code.upper())
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")
    return {
        "room_code": room.code,
        "total_drawn": len(room.drawn_balls),
        "total_winners": len(room.winners),
        "game_log": [e.model_dump() for e in room.game_log],
    }

@router.post("")
def create_room(req: CreateRoomRequest):
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
    return {
        "room_code": room.code,
        "pin": room.pin,
        "host_id": host_player.id,
        "token": host_player.token,
    }

@router.post("/{room_code}/join")
def join_room(room_code: str, req: JoinRoomRequest):
    code = room_code.upper()
    room = room_service.get_room(code)
    if not room:
        raise HTTPException(status_code=404, detail="Sala não encontrada")

    # If room is private, check pin
    if not room.is_public and req.pin and req.pin != room.pin:
        raise HTTPException(status_code=403, detail="PIN de acesso inválido")

    try:
        room, player = room_service.join_room(
            room_code=code,
            player_name=req.player_name.strip() or "Jogador",
            card_count=req.card_count,
            token=req.token,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

@router.post("/{room_code}/prizes")
async def add_prize(room_code: str, req: AddPrizeRequest):
    code = room_code.upper()
    try:
        prize = await room_service.add_prize(code, req.host_id, req.title, req.description)
        return {"success": True, "prize": prize.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{room_code}/prizes/{prize_id}")
async def delete_prize(room_code: str, prize_id: str, host_id: str):
    code = room_code.upper()
    try:
        await room_service.remove_prize(code, host_id, prize_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
