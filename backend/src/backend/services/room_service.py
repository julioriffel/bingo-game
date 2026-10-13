import random
import string
import uuid
import asyncio
import time
import logging
from typing import Dict, Optional, Tuple, List, Any
from ..models.room import (
    Room, Player, RoomStatus, GameStage, WinCondition, DrawMode,
    WinnerInfo, Prize, GameLogEntry, ContestStatus, ContestCandidate, BingoContest
)
from ..models.card import BingoCard
from .bingo_engine import generate_card, check_card_victory, check_card_victory_detailed, get_ball_letter
from .connection_manager import connection_manager

logger = logging.getLogger(__name__)

class RoomService:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.draw_tasks: Dict[str, asyncio.Task] = {}
        self.contest_tasks: Dict[str, asyncio.Task] = {}

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
        contest_window_seconds: float = 10.0,
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
            contest_window_seconds=contest_window_seconds,
            manager_last_active_at=time.time(),
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

        # Log drawn number
        log_entry = GameLogEntry(
            id=f"log_{uuid.uuid4().hex[:8]}",
            event_type="ball_drawn",
            order=len(room.game_log) + 1,
            timestamp=time.time(),
            ball=ball,
            letter=letter,
        )
        room.game_log.append(log_entry)

        await connection_manager.broadcast_to_room(room_code, {
            "type": "ball_drawn",
            "payload": {
                "ball": ball,
                "letter": letter,
                "drawn_count": len(room.drawn_balls),
                "history": room.drawn_balls,
                "log_entry": log_entry.model_dump(),
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
    ) -> Tuple[bool, str, Optional[Any]]:
        room = self.rooms.get(room_code)
        if not room or player_id not in room.players:
            return False, "Sala ou jogador inexistente", None

        player = room.players[player_id]
        if player.is_host:
            return False, "O Manager coordena a partida e não concorre como jogador", None
        target_card = next((c for c in player.cards if c.id == card_id), None)
        if not target_card:
            return False, "Cartela não pertence ao jogador", None

        # 1. Pause draw loop while contest or verification happens
        was_playing = room.status == RoomStatus.PLAYING
        if was_playing:
            room.status = RoomStatus.PAUSED
            if room_code in self.draw_tasks and not self.draw_tasks[room_code].done():
                self.draw_tasks[room_code].cancel()
            await connection_manager.broadcast_to_room(room_code, {
                "type": "game_paused",
                "payload": {"reason": f"{player.name} cantou BINGO! Validando..."}
            })

        # 2. Strict audit against server drawn balls, timing rule, and anti-duplicate prize rule
        drawn_set = set(room.drawn_balls)
        last_ball = room.last_drawn_ball if room.last_drawn_ball is not None else (room.drawn_balls[-1] if room.drawn_balls else None)

        result = check_card_victory_detailed(
            card=target_card,
            drawn_balls=drawn_set,
            win_condition=room.win_condition,
            current_stage=room.stage,
            last_drawn_ball=last_ball,
            already_claimed=set(target_card.claimed_patterns),
        )

        if not result.is_winner:
            # False alarm, expired timing, or duplicate claim
            if was_playing and room.active_contest is None:
                room.status = RoomStatus.PLAYING
                if room.draw_mode == DrawMode.AUTO:
                    self._start_draw_loop(room_code)
            return False, result.rejection_reason or "Bingo não confirmado.", None

        # 3. Format winning numbers sequence (e.g. [12, 24, "FREE", 55, 71])
        winning_nums: List[int | str] = []
        for cell in result.winning_cells:
            if cell.get("row") == 2 and cell.get("col") == 2 and cell.get("number") == 0:
                winning_nums.append("FREE")
            else:
                winning_nums.append(cell.get("number"))

        # Confirmed victory! Mark pattern as claimed on card to prevent duplicate claims
        if result.pattern_id:
            target_card.claimed_patterns.append(result.pattern_id)
            target_card.winning_patterns.append({
                "pattern_id": result.pattern_id,
                "pattern_type": result.pattern_type,
                "pattern_name": result.pattern_name,
                "line_index": result.line_index,
                "winning_cells": result.winning_cells,
            })

        target_prize = next((p for p in room.prizes if p.winner_id is None), None)

        candidate = ContestCandidate(
            player_id=player_id,
            player_name=player.name,
            card_id=card_id,
            win_type=result.win_type or "Bingo",
            pattern_id=result.pattern_id,
            pattern_type=result.pattern_type,
            pattern_name=result.pattern_name,
            line_index=result.line_index,
            winning_cells=result.winning_cells,
            winning_numbers=winning_nums,
            prize_title=target_prize.title if target_prize else None,
        )

        # 4. Check if contest countdown is enabled
        duration = room.contest_window_seconds
        if duration <= 0:
            # Immediate award mode (0s countdown)
            winner_info = await self._award_contest_winner(room_code, None, candidate, was_tiebreaker=False)
            return True, result.win_type or "Bingo", winner_info

        # Contest countdown window (> 0s)
        if room.active_contest is None or room.active_contest.status == ContestStatus.RESOLVED:
            # First candidate on this ball: start 10s contest window
            now = time.time()
            contest = BingoContest(
                id=f"cnt_{uuid.uuid4().hex[:8]}",
                ball=last_ball or 0,
                target_prize_id=target_prize.id if target_prize else None,
                target_prize_title=target_prize.title if target_prize else None,
                status=ContestStatus.WINDOW,
                duration_seconds=duration,
                window_start_time=now,
                window_end_time=now + duration,
                candidates=[candidate],
            )
            room.active_contest = contest

            if room_code in self.contest_tasks and not self.contest_tasks[room_code].done():
                self.contest_tasks[room_code].cancel()

            await connection_manager.broadcast_to_room(room_code, {
                "type": "bingo_countdown_started",
                "payload": {
                    "contest_id": contest.id,
                    "ball": contest.ball,
                    "duration_seconds": duration,
                    "ends_at": contest.window_end_time,
                    "first_candidate": candidate.model_dump(),
                    "candidates": [c.model_dump() for c in contest.candidates],
                    "target_prize": target_prize.model_dump() if target_prize else None,
                    "message": f"🎉 BINGO cantado por {player.name} na pedra {contest.ball}! Janela de {int(duration)}s iniciada!",
                }
            })

            self.contest_tasks[room_code] = asyncio.create_task(
                self._handle_contest_window(room_code, contest.id, duration)
            )
            return True, result.win_type or "Bingo", candidate

        elif room.active_contest.status == ContestStatus.WINDOW:
            # Already in countdown window on same ball
            contest = room.active_contest
            if contest.ball != last_ball:
                return False, "Disputa anterior ainda em encerramento.", None

            if any(c.player_id == player_id for c in contest.candidates):
                return False, "Você já registrou seu Bingo nesta disputa!", None

            contest.candidates.append(candidate)
            await connection_manager.broadcast_to_room(room_code, {
                "type": "bingo_candidate_joined",
                "payload": {
                    "contest_id": contest.id,
                    "ball": contest.ball,
                    "new_candidate": candidate.model_dump(),
                    "candidates": [c.model_dump() for c in contest.candidates],
                    "total_candidates": len(contest.candidates),
                    "message": f"⚡ {player.name} também cantou BINGO na pedra {contest.ball}! Total em disputa: {len(contest.candidates)}.",
                }
            })
            return True, result.win_type or "Bingo", candidate

        else:
            return False, "A janela de contestação para esta pedra já encerrou.", None

    async def _handle_contest_window(self, room_code: str, contest_id: str, duration: float):
        try:
            await asyncio.sleep(duration)
        except asyncio.CancelledError:
            return

        room = self.rooms.get(room_code)
        if not room or not room.active_contest or room.active_contest.id != contest_id:
            return

        contest = room.active_contest
        if contest.status != ContestStatus.WINDOW:
            return

        if len(contest.candidates) == 1:
            # Sole winner
            await self._award_contest_winner(room_code, contest, contest.candidates[0], was_tiebreaker=False)
        elif len(contest.candidates) > 1:
            # Tie! Start stone showdown tiebreaker
            await self._start_tiebreaker(room_code, contest)

    async def _start_tiebreaker(self, room_code: str, contest: BingoContest):
        room = self.rooms.get(room_code)
        if not room:
            return

        contest.status = ContestStatus.TIEBREAKER
        # Unique random stone numbers from 1 to 75
        available = random.sample(range(1, 76), max(12, len(contest.candidates) * 3))
        contest.available_stones = available

        timeout_seconds = 15.0
        await connection_manager.broadcast_to_room(room_code, {
            "type": "bingo_tiebreaker_started",
            "payload": {
                "contest_id": contest.id,
                "ball": contest.ball,
                "prize_title": contest.target_prize_title,
                "candidates": [c.model_dump() for c in contest.candidates],
                "timeout_seconds": timeout_seconds,
                "stone_options_count": 6,
                "message": f"⚔️ EMPATE! {len(contest.candidates)} jogadores cantaram Bingo na pedra {contest.ball}! Escolha sua pedra da sorte!",
            }
        })

        if room_code in self.contest_tasks and not self.contest_tasks[room_code].done():
            self.contest_tasks[room_code].cancel()
        self.contest_tasks[room_code] = asyncio.create_task(
            self._handle_tiebreaker_timeout(room_code, contest.id, timeout_seconds)
        )

    async def pick_contest_stone(self, room_code: str, player_id: str, stone_index: Optional[int] = None) -> bool:
        room = self.rooms.get(room_code)
        if not room or not room.active_contest:
            return False

        contest = room.active_contest
        if contest.status != ContestStatus.TIEBREAKER:
            return False

        candidate = next((c for c in contest.candidates if c.player_id == player_id), None)
        if not candidate or candidate.chosen_stone is not None:
            return False

        if not contest.available_stones:
            used = {c.chosen_stone for c in contest.candidates if c.chosen_stone is not None}
            avail = [n for n in range(1, 76) if n not in used]
            contest.available_stones = random.sample(avail, len(avail))

        # Pop unique stone ensuring no duplicates
        chosen_stone = contest.available_stones.pop(0)
        candidate.chosen_stone = chosen_stone
        candidate.stone_picked_at = time.time()

        all_picked = all(c.chosen_stone is not None for c in contest.candidates)

        await connection_manager.broadcast_to_room(room_code, {
            "type": "tiebreaker_stone_revealed",
            "payload": {
                "contest_id": contest.id,
                "player_id": player_id,
                "player_name": candidate.player_name,
                "chosen_stone": chosen_stone,
                "candidates": [c.model_dump() for c in contest.candidates],
                "all_picked": all_picked,
            }
        })

        if all_picked:
            if room_code in self.contest_tasks and not self.contest_tasks[room_code].done():
                self.contest_tasks[room_code].cancel()
            await self._resolve_tiebreaker(room_code, contest)

        return True

    async def _handle_tiebreaker_timeout(self, room_code: str, contest_id: str, timeout_seconds: float):
        try:
            await asyncio.sleep(timeout_seconds)
        except asyncio.CancelledError:
            return

        room = self.rooms.get(room_code)
        if not room or not room.active_contest or room.active_contest.id != contest_id:
            return

        contest = room.active_contest
        if contest.status != ContestStatus.TIEBREAKER:
            return

        # Auto-pick for any candidate who hasn't chosen
        for cand in contest.candidates:
            if cand.chosen_stone is None:
                if not contest.available_stones:
                    used = {c.chosen_stone for c in contest.candidates if c.chosen_stone is not None}
                    avail = [n for n in range(1, 76) if n not in used]
                    contest.available_stones = random.sample(avail, len(avail))
                stone = contest.available_stones.pop(0)
                cand.chosen_stone = stone
                cand.stone_picked_at = time.time()
                await connection_manager.broadcast_to_room(room_code, {
                    "type": "tiebreaker_stone_revealed",
                    "payload": {
                        "contest_id": contest.id,
                        "player_id": cand.player_id,
                        "player_name": cand.player_name,
                        "chosen_stone": stone,
                        "candidates": [c.model_dump() for c in contest.candidates],
                        "all_picked": True,
                        "auto_picked": True,
                    }
                })

        await self._resolve_tiebreaker(room_code, contest)

    async def _resolve_tiebreaker(self, room_code: str, contest: BingoContest):
        room = self.rooms.get(room_code)
        if not room:
            return

        contest.status = ContestStatus.RESOLVED

        # Pick candidate with highest stone
        winner_cand = max(contest.candidates, key=lambda c: c.chosen_stone if c.chosen_stone is not None else -1)
        contest.winner_player_id = winner_cand.player_id

        summary_parts = [f"{c.player_name} (pedra {c.chosen_stone})" for c in contest.candidates]
        tiebreaker_summary = f"Desempate: {', '.join(summary_parts)} — Vencedor: {winner_cand.player_name} com a maior pedra ({winner_cand.chosen_stone})"

        tb_log = GameLogEntry(
            id=f"log_{uuid.uuid4().hex[:8]}",
            event_type="bingo_tiebreaker",
            order=len(room.game_log) + 1,
            timestamp=time.time(),
            ball=contest.ball,
            player_id=winner_cand.player_id,
            player_name=winner_cand.player_name,
            details=tiebreaker_summary,
            prize_title=contest.target_prize_title,
        )
        room.game_log.append(tb_log)

        await connection_manager.broadcast_to_room(room_code, {
            "type": "tiebreaker_resolved",
            "payload": {
                "contest_id": contest.id,
                "winner_player_id": winner_cand.player_id,
                "winner_player_name": winner_cand.player_name,
                "winning_stone": winner_cand.chosen_stone,
                "candidates": [c.model_dump() for c in contest.candidates],
                "summary": tiebreaker_summary,
                "log_entry": tb_log.model_dump(),
                "game_log": [e.model_dump() for e in room.game_log],
                "message": f"🏆 {winner_cand.player_name} venceu o desempate com a pedra {winner_cand.chosen_stone}!",
            }
        })

        # Short pause for dramatic suspense before awarding prize
        await asyncio.sleep(2.5)
        await self._award_contest_winner(room_code, contest, winner_cand, was_tiebreaker=True)

    async def _award_contest_winner(
        self, room_code: str, contest: Optional[BingoContest], winner_cand: ContestCandidate, was_tiebreaker: bool = False
    ) -> WinnerInfo:
        room = self.rooms.get(room_code)
        if not room:
            raise ValueError("Sala inexistente")

        # Award next available prize
        awarded_prize: Optional[Prize] = None
        for p in room.prizes:
            if p.winner_id is None:
                p.winner_id = winner_cand.player_id
                p.winner_name = winner_cand.player_name
                p.won_at = time.time()
                awarded_prize = p
                break

        on_ball = contest.ball if contest else room.last_drawn_ball
        winner_info = WinnerInfo(
            player_id=winner_cand.player_id,
            player_name=winner_cand.player_name,
            card_id=winner_cand.card_id,
            win_type=winner_cand.win_type or "Bingo",
            drawn_count=len(room.drawn_balls),
            pattern_id=winner_cand.pattern_id,
            pattern_type=winner_cand.pattern_type,
            pattern_name=winner_cand.pattern_name,
            line_index=winner_cand.line_index,
            winning_cells=winner_cand.winning_cells,
            winning_numbers=winner_cand.winning_numbers,
            on_ball=on_ball,
            prize_title=awarded_prize.title if awarded_prize else None,
        )
        room.winners.append(winner_info)

        tb_detail = f"Venceu no desempate da pedra maior ({winner_cand.chosen_stone})" if was_tiebreaker and winner_cand.chosen_stone else None
        win_log_entry = GameLogEntry(
            id=f"log_{uuid.uuid4().hex[:8]}",
            event_type="bingo_awarded",
            order=len(room.game_log) + 1,
            timestamp=time.time(),
            player_id=winner_cand.player_id,
            player_name=winner_cand.player_name,
            card_id=winner_cand.card_id,
            win_type=winner_cand.win_type,
            pattern_name=winner_cand.pattern_name,
            winning_numbers=winner_cand.winning_numbers,
            prize_title=awarded_prize.title if awarded_prize else None,
            on_ball=on_ball,
            details=tb_detail,
        )
        room.game_log.append(win_log_entry)

        # Clear active contest
        room.active_contest = None

        prize_announcement = f" e faturou: 🎁 {awarded_prize.title}!" if awarded_prize else "!"
        tb_mention = " após desempate da pedra mais alta" if was_tiebreaker else ""

        # Check multi-stage progression
        if room.win_condition == WinCondition.MULTI_STAGE and room.stage == GameStage.LINE:
            room.stage = GameStage.BLACKOUT
            await connection_manager.broadcast_to_room(room_code, {
                "type": "bingo_valid",
                "payload": {
                    "winner": winner_info.model_dump(),
                    "card_id": winner_cand.card_id,
                    "pattern_id": winner_cand.pattern_id,
                    "pattern_type": winner_cand.pattern_type,
                    "pattern_name": winner_cand.pattern_name,
                    "line_index": winner_cand.line_index,
                    "winning_cells": winner_cand.winning_cells,
                    "winning_numbers": winner_cand.winning_numbers,
                    "on_ball": on_ball,
                    "was_tiebreaker": was_tiebreaker,
                    "winning_stone": winner_cand.chosen_stone if was_tiebreaker else None,
                    "log_entry": win_log_entry.model_dump(),
                    "game_log": [e.model_dump() for e in room.game_log],
                    "awarded_prize": awarded_prize.model_dump() if awarded_prize else None,
                    "prizes": [p.model_dump() for p in room.prizes],
                    "next_stage": "blackout",
                    "stage_name": "Cartela Cheia",
                    "message": f"Parabéns! {winner_cand.player_name} bateu Linha ({winner_cand.pattern_name}){tb_mention}{prize_announcement} A partida continua para Cartela Cheia!",
                }
            })
            asyncio.create_task(self._resume_after_delay(room_code, 5.0))
        else:
            has_more_prizes = any(p.winner_id is None for p in room.prizes)
            if has_more_prizes and room.win_condition == WinCondition.LINE:
                await connection_manager.broadcast_to_room(room_code, {
                    "type": "bingo_valid",
                    "payload": {
                        "winner": winner_info.model_dump(),
                        "card_id": winner_cand.card_id,
                        "pattern_id": winner_cand.pattern_id,
                        "pattern_type": winner_cand.pattern_type,
                        "pattern_name": winner_cand.pattern_name,
                        "line_index": winner_cand.line_index,
                        "winning_cells": winner_cand.winning_cells,
                        "winning_numbers": winner_cand.winning_numbers,
                        "on_ball": on_ball,
                        "was_tiebreaker": was_tiebreaker,
                        "winning_stone": winner_cand.chosen_stone if was_tiebreaker else None,
                        "log_entry": win_log_entry.model_dump(),
                        "game_log": [e.model_dump() for e in room.game_log],
                        "awarded_prize": awarded_prize.model_dump() if awarded_prize else None,
                        "prizes": [p.model_dump() for p in room.prizes],
                        "next_stage": None,
                        "game_over": False,
                        "message": f"Parabéns! {winner_cand.player_name} bateu Linha ({winner_cand.pattern_name}){tb_mention}{prize_announcement} A partida continua para os próximos prêmios!",
                    }
                })
                asyncio.create_task(self._resume_after_delay(room_code, 5.0))
            else:
                room.status = RoomStatus.FINISHED
                room.stage = GameStage.COMPLETED
                await connection_manager.broadcast_to_room(room_code, {
                    "type": "bingo_valid",
                    "payload": {
                        "winner": winner_info.model_dump(),
                        "card_id": winner_cand.card_id,
                        "pattern_id": winner_cand.pattern_id,
                        "pattern_type": winner_cand.pattern_type,
                        "pattern_name": winner_cand.pattern_name,
                        "line_index": winner_cand.line_index,
                        "winning_cells": winner_cand.winning_cells,
                        "winning_numbers": winner_cand.winning_numbers,
                        "on_ball": on_ball,
                        "was_tiebreaker": was_tiebreaker,
                        "winning_stone": winner_cand.chosen_stone if was_tiebreaker else None,
                        "log_entry": win_log_entry.model_dump(),
                        "game_log": [e.model_dump() for e in room.game_log],
                        "awarded_prize": awarded_prize.model_dump() if awarded_prize else None,
                        "prizes": [p.model_dump() for p in room.prizes],
                        "next_stage": None,
                        "game_over": True,
                        "message": f"🎉 BINGO! Parabéns {winner_cand.player_name} venceu a partida ({winner_cand.pattern_name}){tb_mention}{prize_announcement}",
                    }
                })

        return winner_info

    async def resolve_contest_window(self, room_code: str):
        room = self.rooms.get(room_code)
        if not room or not room.active_contest or room.active_contest.status != ContestStatus.WINDOW:
            return
        contest = room.active_contest
        if room_code in self.contest_tasks and not self.contest_tasks[room_code].done():
            self.contest_tasks[room_code].cancel()
        if len(contest.candidates) == 1:
            await self._award_contest_winner(room_code, contest, contest.candidates[0], was_tiebreaker=False)
        elif len(contest.candidates) > 1:
            await self._start_tiebreaker(room_code, contest)

    async def _resume_after_delay(self, room_code: str, delay: float):
        await asyncio.sleep(delay)
        room = self.rooms.get(room_code)
        if room and room.status == RoomStatus.PAUSED and room.stage != GameStage.COMPLETED and room.active_contest is None:
            room.status = RoomStatus.PLAYING
            await connection_manager.broadcast_to_room(room_code, {
                "type": "game_resumed",
                "payload": {"is_paused": False, "stage": room.stage.value}
            })
            if room.draw_mode == DrawMode.AUTO:
                self._start_draw_loop(room_code)

    def touch_manager_activity(self, room_code: str, player_id: str) -> bool:
        room = self.rooms.get(room_code)
        if not room:
            return False
        now = time.time()
        if player_id in room.players:
            room.players[player_id].last_active_at = now
        if room.host_id == player_id:
            room.manager_last_active_at = now
            return True
        return False

    async def claim_manager(self, room_code: str, player_id: str, threshold_seconds: float = 120.0) -> Tuple[Room, Player]:
        room = self.rooms.get(room_code)
        if not room:
            raise ValueError(f"Sala '{room_code}' não encontrada.")

        new_manager = room.players.get(player_id)
        if not new_manager:
            raise ValueError("Jogador não encontrado na sala.")

        if room.host_id == player_id:
            raise ValueError("Você já é o manager desta sala.")

        # Check inactivity of current manager (120 seconds threshold)
        if not room.is_manager_inactive(threshold_seconds):
            elapsed = time.time() - room.manager_last_active_at
            remaining = int(max(0, threshold_seconds - elapsed))
            raise ValueError(
                f"O manager ainda está ativo. Só é possível assumir após 2 minutos de inatividade ({remaining}s restantes)."
            )

        old_manager = room.players.get(room.host_id)
        if old_manager:
            old_manager.is_host = False

        new_manager.is_host = True
        room.host_id = new_manager.id
        room.host_name = new_manager.name
        room.manager_last_active_at = time.time()
        new_manager.last_active_at = time.time()

        # Log to game_log
        log_entry = GameLogEntry(
            id=f"log_{uuid.uuid4().hex[:8]}",
            event_type="manager_transferred",
            order=len(room.game_log) + 1,
            timestamp=time.time(),
            player_id=new_manager.id,
            player_name=new_manager.name,
            details=f"{new_manager.name} assumiu a gerência da sala por inatividade do manager anterior.",
        )
        room.game_log.append(log_entry)

        # Broadcast manager_changed and player_list_update
        await connection_manager.broadcast_to_room(room_code, {
            "type": "manager_changed",
            "payload": {
                "host_id": new_manager.id,
                "host_name": new_manager.name,
                "manager_last_active_at": room.manager_last_active_at,
                "message": f"{new_manager.name} assumiu o gerenciamento da sala.",
                "log_entry": log_entry.model_dump(),
            }
        })

        await connection_manager.broadcast_to_room(room_code, {
            "type": "player_list_update",
            "payload": {
                "host_id": room.host_id,
                "host_name": room.host_name,
                "manager_last_active_at": room.manager_last_active_at,
                "manager_inactive": room.is_manager_inactive(),
                "player_count": room.get_player_count(),
                "players": [
                    {"id": p.id, "name": p.name, "is_host": p.is_host, "connected": p.connected}
                    for p in room.players.values() if not p.is_host
                ],
                "users": room.get_connected_users_list(),
            }
        })

        return room, new_manager

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
                    "player_count": r.get_player_count(),
                    "max_cards": r.max_cards_per_player,
                    "prizes_count": len(r.prizes),
                    "prizes": [p.model_dump() for p in r.prizes],
                })
        return public_list

room_service = RoomService()
