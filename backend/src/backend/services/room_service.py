import random
import string
import uuid
import asyncio
import time
import logging
from typing import Dict, Optional, Tuple, List
from ..models.room import Room, Player, RoomStatus, GameStage, WinCondition, DrawMode, WinnerInfo, Prize
from ..models.card import BingoCard
from .bingo_engine import generate_card, check_card_victory, get_ball_letter
from .connection_manager import connection_manager

logger = logging.getLogger(__name__)

class RoomService:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.draw_tasks: Dict[str, asyncio.Task] = {}

    def _generate_room_code(self) -> str:
        while True:
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if code not in self.rooms:
                return code

    def _generate_pin(self) -> str:
        return "".join(random.choices(string.digits, k=4))

    def create_room(
        self,
        host_name: str,
        name: str = "",
        win_condition: WinCondition = WinCondition.MULTI_STAGE,
        max_cards_per_player: int = 4,
        is_public: bool = True,
        draw_interval: float = 5.0,
        draw_mode: DrawMode = DrawMode.AUTO,
        prizes: Optional[List[dict]] = None,
    ) -> Tuple[Room, Player]:
        room_code = self._generate_room_code()
        pin = self._generate_pin()
        host_id = f"host_{uuid.uuid4().hex[:8]}"
        token = uuid.uuid4().hex

        # Host as player (can toggle participating or watching)
        host_player = Player(
            id=host_id,
            name=host_name,
            is_host=True,
            token=token,
        )

        all_balls = list(range(1, 76))
        random.shuffle(all_balls)

        # Process initial prizes
        room_prizes: List[Prize] = []
        if prizes:
            for idx, p in enumerate(prizes, start=1):
                title = p.get("title", "").strip() if isinstance(p, dict) else getattr(p, "title", "").strip()
                desc = p.get("description", "").strip() if isinstance(p, dict) else getattr(p, "description", "").strip()
                if title:
                    room_prizes.append(Prize(
                        id=f"prz_{uuid.uuid4().hex[:6]}",
                        title=title,
                        description=desc,
                        order=idx,
                    ))

        room = Room(
            code=room_code,
            pin=pin,
            name=name or f"Bingo do {host_name}",
            is_public=is_public,
            host_id=host_id,
            host_name=host_name,
            win_condition=win_condition,
            max_cards_per_player=max_cards_per_player,
            draw_interval=draw_interval,
            draw_mode=draw_mode,
            status=RoomStatus.LOBBY,
            stage=GameStage.WAITING,
            remaining_balls=all_balls,
            drawn_balls=[],
            players={host_id: host_player},
            prizes=room_prizes,
        )
        self.rooms[room_code] = room
        return room, host_player

    def get_room(self, room_code: str) -> Optional[Room]:
        return self.rooms.get(room_code)

    def join_room(
        self,
        room_code: str,
        player_name: str,
        card_count: int = 1,
        token: Optional[str] = None,
    ) -> Tuple[Room, Player]:
        room = self.rooms.get(room_code)
        if not room:
            raise ValueError(f"Sala '{room_code}' não encontrada.")

        # Check existing token for reconnection
        if token:
            for existing_player in room.players.values():
                if existing_player.token == token:
                    existing_player.connected = True
                    return room, existing_player

        player_id = f"p_{uuid.uuid4().hex[:8]}"
        new_token = uuid.uuid4().hex

        # Generate requested cards (clamped between 1 and max_cards_per_player)
        count = max(1, min(card_count, room.max_cards_per_player))
        cards: List[BingoCard] = []
        for i in range(count):
            card_id = f"{player_id}_c{i+1}"
            cards.append(generate_card(card_id))

        player = Player(
            id=player_id,
            name=player_name,
            is_host=False,
            cards=cards,
            token=new_token,
            connected=True,
        )
        room.players[player_id] = player
        return room, player

    async def start_game(self, room_code: str, host_id: str) -> Room:
        room = self.rooms.get(room_code)
        if not room:
            raise ValueError(f"Sala '{room_code}' não encontrada.")
        if room.host_id != host_id:
            raise PermissionError("Apenas o Host pode iniciar a partida.")

        room.status = RoomStatus.PLAYING
        if room.win_condition == WinCondition.MULTI_STAGE:
            room.stage = GameStage.LINE
        elif room.win_condition == WinCondition.LINE:
            room.stage = GameStage.LINE
        else:
            room.stage = GameStage.BLACKOUT

        # Broadcast game started
        await connection_manager.broadcast_to_room(room_code, {
            "type": "game_started",
            "payload": {
                "room_code": room_code,
                "stage": room.stage.value,
                "win_condition": room.win_condition.value,
                "draw_mode": room.draw_mode.value,
                "draw_interval": room.draw_interval,
                "prizes": [p.model_dump() for p in room.prizes],
            }
        })

        if room.draw_mode == DrawMode.AUTO:
            self._start_draw_loop(room_code)

        return room

    def _start_draw_loop(self, room_code: str):
        if room_code in self.draw_tasks and not self.draw_tasks[room_code].done():
            self.draw_tasks[room_code].cancel()
        self.draw_tasks[room_code] = asyncio.create_task(self._draw_loop(room_code))

    async def _draw_loop(self, room_code: str):
        try:
            while True:
                room = self.rooms.get(room_code)
                if not room or room.status != RoomStatus.PLAYING:
                    break

                await asyncio.sleep(room.draw_interval)
                room = self.rooms.get(room_code)
                if not room or room.status != RoomStatus.PLAYING:
                    break

                result = await self.draw_next_ball(room_code)
                if not result:
                    break
        except asyncio.CancelledError:
            pass

    async def draw_next_ball(self, room_code: str) -> Optional[Tuple[int, str]]:
        room = self.rooms.get(room_code)
        if not room:
            return None
        if not room.remaining_balls:
            room.status = RoomStatus.FINISHED
            await connection_manager.broadcast_to_room(room_code, {
                "type": "game_over",
                "payload": {"reason": "Todas as 75 pedras foram sorteadas."}
            })
            return None

        ball = room.remaining_balls.pop(0)
        room.drawn_balls.append(ball)
        room.last_drawn_ball = ball
        letter = get_ball_letter(ball)

        await connection_manager.broadcast_to_room(room_code, {
            "type": "ball_drawn",
            "payload": {
                "ball": ball,
                "letter": letter,
                "drawn_count": len(room.drawn_balls),
                "history": room.drawn_balls,
            }
        })
        return ball, letter

    async def toggle_pause(self, room_code: str, host_id: str) -> Room:
        room = self.rooms.get(room_code)
        if not room or room.host_id != host_id:
            raise PermissionError("Não autorizado.")

        if room.status == RoomStatus.PLAYING:
            room.status = RoomStatus.PAUSED
            if room_code in self.draw_tasks:
                self.draw_tasks[room_code].cancel()
            await connection_manager.broadcast_to_room(room_code, {
                "type": "game_paused",
                "payload": {"is_paused": True}
            })
        elif room.status == RoomStatus.PAUSED:
            room.status = RoomStatus.PLAYING
            await connection_manager.broadcast_to_room(room_code, {
                "type": "game_resumed",
                "payload": {"is_paused": False}
            })
            if room.draw_mode == DrawMode.AUTO:
                self._start_draw_loop(room_code)

        return room

    async def set_speed(self, room_code: str, host_id: str, interval: float) -> Room:
        room = self.rooms.get(room_code)
        if not room or room.host_id != host_id:
            raise PermissionError("Não autorizado.")
        room.draw_interval = max(2.0, min(interval, 20.0))
        await connection_manager.broadcast_to_room(room_code, {
            "type": "speed_changed",
            "payload": {"draw_interval": room.draw_interval}
        })
        return room

    def mark_number(self, room_code: str, player_id: str, card_id: str, number: int) -> bool:
        room = self.rooms.get(room_code)
        if not room or player_id not in room.players:
            return False
        player = room.players[player_id]
        for card in player.cards:
            if card.id == card_id:
                for row in card.grid:
                    for cell in row:
                        if cell.number == number and not cell.is_free:
                            cell.marked = not cell.marked
                            return True
        return False

    async def add_prize(self, room_code: str, host_id: str, title: str, description: str = "") -> Prize:
        room = self.rooms.get(room_code)
        if not room or room.host_id != host_id:
            raise PermissionError("Não autorizado.")
        prize = Prize(
            id=f"prz_{uuid.uuid4().hex[:6]}",
            title=title.strip(),
            description=description.strip(),
            order=len(room.prizes) + 1,
        )
        room.prizes.append(prize)
        await connection_manager.broadcast_to_room(room_code, {
            "type": "prizes_updated",
            "payload": {"prizes": [p.model_dump() for p in room.prizes]}
        })
        return prize

    async def remove_prize(self, room_code: str, host_id: str, prize_id: str) -> bool:
        room = self.rooms.get(room_code)
        if not room or room.host_id != host_id:
            raise PermissionError("Não autorizado.")
        room.prizes = [p for p in room.prizes if p.id != prize_id]
        # Re-index order
        for idx, p in enumerate(room.prizes, start=1):
            p.order = idx
        await connection_manager.broadcast_to_room(room_code, {
            "type": "prizes_updated",
            "payload": {"prizes": [p.model_dump() for p in room.prizes]}
        })
        return True

    async def call_bingo(
        self, room_code: str, player_id: str, card_id: str
    ) -> Tuple[bool, str, Optional[WinnerInfo]]:
        room = self.rooms.get(room_code)
        if not room or player_id not in room.players:
            return False, "Sala ou jogador inexistente", None

        player = room.players[player_id]
        target_card = next((c for c in player.cards if c.id == card_id), None)
        if not target_card:
            return False, "Cartela não pertence ao jogador", None

        # 1. Immediately pause draw loop while verifying
        was_playing = room.status == RoomStatus.PLAYING
        if was_playing:
            room.status = RoomStatus.PAUSED
            if room_code in self.draw_tasks:
                self.draw_tasks[room_code].cancel()
            await connection_manager.broadcast_to_room(room_code, {
                "type": "game_paused",
                "payload": {"reason": f"{player.name} cantou BINGO! Validando..."}
            })

        # 2. Strict audit against server drawn balls
        drawn_set = set(room.drawn_balls)
        is_winner, win_type = check_card_victory(
            target_card, drawn_set, room.win_condition, room.stage
        )

        if not is_winner or not win_type:
            # False alarm
            if was_playing:
                room.status = RoomStatus.PLAYING
                if room.draw_mode == DrawMode.AUTO:
                    self._start_draw_loop(room_code)
            return False, "Bingo não confirmado: a cartela não atende aos critérios com as pedras sorteadas.", None

        # 3. Confirmed victory! Award prize if available
        awarded_prize: Optional[Prize] = None
        for p in room.prizes:
            if p.winner_id is None:
                p.winner_id = player_id
                p.winner_name = player.name
                p.won_at = time.time()
                awarded_prize = p
                break

        winner_info = WinnerInfo(
            player_id=player_id,
            player_name=player.name,
            card_id=card_id,
            win_type=win_type,
            drawn_count=len(room.drawn_balls),
            prize_title=awarded_prize.title if awarded_prize else None,
        )
        room.winners.append(winner_info)

        prize_announcement = f" e faturou: 🎁 {awarded_prize.title}!" if awarded_prize else "!"

        # Check multi-stage progression
        if room.win_condition == WinCondition.MULTI_STAGE and room.stage == GameStage.LINE:
            # Advance to stage 2: Cartela Cheia (Blackout)
            room.stage = GameStage.BLACKOUT
            await connection_manager.broadcast_to_room(room_code, {
                "type": "bingo_valid",
                "payload": {
                    "winner": winner_info.model_dump(),
                    "awarded_prize": awarded_prize.model_dump() if awarded_prize else None,
                    "prizes": [p.model_dump() for p in room.prizes],
                    "next_stage": "blackout",
                    "stage_name": "Cartela Cheia",
                    "message": f"Parabéns! {player.name} bateu Linha{prize_announcement} A partida continua para Cartela Cheia!",
                }
            })
            # Resume draw loop after short 5-second celebration delay
            asyncio.create_task(self._resume_after_delay(room_code, 5.0))
        else:
            # Game complete
            room.status = RoomStatus.FINISHED
            room.stage = GameStage.COMPLETED
            await connection_manager.broadcast_to_room(room_code, {
                "type": "bingo_valid",
                "payload": {
                    "winner": winner_info.model_dump(),
                    "awarded_prize": awarded_prize.model_dump() if awarded_prize else None,
                    "prizes": [p.model_dump() for p in room.prizes],
                    "next_stage": None,
                    "game_over": True,
                    "message": f"🎉 BINGO! Parabéns {player.name} venceu a partida{prize_announcement}",
                }
            })

        return True, win_type, winner_info

    async def _resume_after_delay(self, room_code: str, delay: float):
        await asyncio.sleep(delay)
        room = self.rooms.get(room_code)
        if room and room.status == RoomStatus.PAUSED and room.stage != GameStage.COMPLETED:
            room.status = RoomStatus.PLAYING
            await connection_manager.broadcast_to_room(room_code, {
                "type": "game_resumed",
                "payload": {"is_paused": False, "stage": room.stage.value}
            })
            if room.draw_mode == DrawMode.AUTO:
                self._start_draw_loop(room_code)

    def get_public_rooms(self) -> List[dict]:
        public_list = []
        for r in self.rooms.values():
            if r.is_public and r.status in (RoomStatus.LOBBY, RoomStatus.PLAYING):
                public_list.append({
                    "code": r.code,
                    "name": r.name,
                    "host_name": r.host_name,
                    "status": r.status.value,
                    "win_condition": r.win_condition.value,
                    "player_count": len([p for p in r.players.values() if p.connected]),
                    "max_cards": r.max_cards_per_player,
                    "prizes_count": len(r.prizes),
                    "prizes": [p.model_dump() for p in r.prizes],
                })
        return public_list

room_service = RoomService()
