import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services.connection_manager import connection_manager
from ..services.room_service import room_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websockets"])

@router.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):
    code = room_code.upper()
    room = room_service.get_room(code)
    if not room:
        await websocket.close(code=4004, reason="Sala inexistente")
        return

    # Temporary player ID until handshake message
    temp_player_id = f"anon_{id(websocket)}"
    await connection_manager.connect(code, websocket, temp_player_id)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await connection_manager.send_personal(websocket, {
                    "type": "error", "payload": {"message": "JSON inválido"}
                })
                continue

            msg_type = msg.get("type")
            payload = msg.get("payload", {})

            if msg_type == "ping":
                await connection_manager.send_personal(websocket, {"type": "pong"})

            elif msg_type == "join":
                # Handshake associating player token/id to this socket
                player_id = payload.get("player_id")
                token = payload.get("token")
                player = room.players.get(player_id)
                if player and player.token == token:
                    connection_manager.socket_meta[websocket] = (code, player_id)
                    player.connected = True
                    # Broadcast updated player list
                    await connection_manager.broadcast_to_room(code, {
                        "type": "player_list_update",
                        "payload": {
                            "players": [
                                {"id": p.id, "name": p.name, "is_host": p.is_host, "connected": p.connected}
                                for p in room.players.values()
                            ]
                        }
                    })
                    # Send current room state to joining player
                    await connection_manager.send_personal(websocket, {
                        "type": "room_state",
                        "payload": {
                            "code": room.code,
                            "status": room.status.value,
                            "stage": room.stage.value,
                            "drawn_balls": room.drawn_balls,
                            "last_drawn_ball": room.last_drawn_ball,
                            "draw_interval": room.draw_interval,
                            "draw_mode": room.draw_mode.value,
                            "winners": [w.model_dump() for w in room.winners],
                            "prizes": [p.model_dump() for p in room.prizes],
                            "game_log": [e.model_dump() for e in room.game_log],
                        }
                    })

            elif msg_type == "start_game":
                host_id = payload.get("host_id")
                try:
                    await room_service.start_game(code, host_id)
                except Exception as e:
                    await connection_manager.send_personal(websocket, {
                        "type": "error", "payload": {"message": str(e)}
                    })

            elif msg_type == "draw_next":
                host_id = payload.get("host_id")
                if room.host_id == host_id:
                    await room_service.draw_next_ball(code)

            elif msg_type == "toggle_pause":
                host_id = payload.get("host_id")
                try:
                    await room_service.toggle_pause(code, host_id)
                except Exception as e:
                    await connection_manager.send_personal(websocket, {
                        "type": "error", "payload": {"message": str(e)}
                    })

            elif msg_type == "set_speed":
                host_id = payload.get("host_id")
                interval = payload.get("interval", 5.0)
                try:
                    await room_service.set_speed(code, host_id, float(interval))
                except Exception as e:
                    await connection_manager.send_personal(websocket, {
                        "type": "error", "payload": {"message": str(e)}
                    })

            elif msg_type == "mark_number":
                player_id = payload.get("player_id")
                card_id = payload.get("card_id")
                number = payload.get("number")
                if player_id and card_id and number is not None:
                    room_service.mark_number(code, player_id, card_id, int(number))

            elif msg_type == "call_bingo":
                player_id = payload.get("player_id")
                card_id = payload.get("card_id")
                valid, reason, winner_info = await room_service.call_bingo(code, player_id, card_id)
                if not valid:
                    await connection_manager.send_personal(websocket, {
                        "type": "bingo_invalid",
                        "payload": {"reason": reason}
                    })

            elif msg_type == "add_prize":
                host_id = payload.get("host_id")
                title = payload.get("title", "")
                description = payload.get("description", "")
                if host_id and title:
                    try:
                        await room_service.add_prize(code, host_id, title, description)
                    except Exception as e:
                        await connection_manager.send_personal(websocket, {
                            "type": "error", "payload": {"message": str(e)}
                        })

            elif msg_type == "remove_prize":
                host_id = payload.get("host_id")
                prize_id = payload.get("prize_id")
                if host_id and prize_id:
                    try:
                        await room_service.remove_prize(code, host_id, prize_id)
                    except Exception as e:
                        await connection_manager.send_personal(websocket, {
                            "type": "error", "payload": {"message": str(e)}
                        })

    except WebSocketDisconnect:
        meta = connection_manager.disconnect(websocket)
        if meta:
            r_code, p_id = meta
            if r_code in room_service.rooms:
                r = room_service.rooms[r_code]
                if p_id in r.players:
                    r.players[p_id].connected = False
                    await connection_manager.broadcast_to_room(r_code, {
                        "type": "player_list_update",
                        "payload": {
                            "players": [
                                {"id": p.id, "name": p.name, "is_host": p.is_host, "connected": p.connected}
                                for p in r.players.values()
                            ]
                        }
                    })
