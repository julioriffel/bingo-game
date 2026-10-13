import json
import logging
from typing import Dict, List
from fastapi import WebSocket
from .redis_service import redis_service

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # room_code -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # websocket -> (room_code, player_id)
        self.socket_meta: Dict[WebSocket, tuple[str, str]] = {}
        # Register Redis listener for distributed broadcasts
        redis_service.subscribe_local("bingo_broadcast", self._handle_broadcast)

    async def connect(self, room_code: str, websocket: WebSocket, player_id: str):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = []
        self.active_connections[room_code].append(websocket)
        self.socket_meta[websocket] = (room_code, player_id)

    def disconnect(self, websocket: WebSocket) -> tuple[str, str] | None:
        meta = self.socket_meta.pop(websocket, None)
        if meta:
            room_code, player_id = meta
            if room_code in self.active_connections:
                if websocket in self.active_connections[room_code]:
                    self.active_connections[room_code].remove(websocket)
                if not self.active_connections[room_code]:
                    del self.active_connections[room_code]
            return room_code, player_id
        return None

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.warning("Error sending personal WS message: %s", e)

    async def broadcast_to_room(self, room_code: str, message: dict):
        """Broadcasts message locally and publishes via Redis for horizontal scaling."""
        # 1. Publish to Redis / distributed channel
        await redis_service.publish(f"room:{room_code}", message)

        # 2. Local direct broadcast
        connections = self.active_connections.get(room_code, [])
        dead_connections = []
        payload_str = json.dumps(message)
        for ws in connections:
            try:
                await ws.send_text(payload_str)
            except Exception:
                dead_connections.append(ws)

        for dead_ws in dead_connections:
            self.disconnect(dead_ws)

    async def _handle_broadcast(self, message: dict):
        room_code = message.get("room_code")
        if room_code and room_code in self.active_connections:
            payload = message.get("payload", {})
            payload_str = json.dumps(payload)
            for ws in list(self.active_connections[room_code]):
                try:
                    await ws.send_text(payload_str)
                except Exception:
                    self.disconnect(ws)

connection_manager = ConnectionManager()
