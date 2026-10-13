import pytest
from backend.services.room_service import room_service
from backend.models.room import WinCondition, ContestStatus

@pytest.mark.asyncio
async def test_single_player_bingo_countdown_awards_sole_candidate():
    room, host = room_service.create_room(
        host_name="Host 1",
        win_condition=WinCondition.LINE,
        contest_window_seconds=10.0,
        prizes=[{"title": "Bicicleta Aro 29"}]
    )
    code = room.code
    _, p1 = room_service.join_room(code, "Carlos", card_count=1)
    await room_service.start_game(code, host.id)

    # Draw completing line for Carlos
    row_0 = [c.number for c in p1.cards[0].grid[0] if not c.is_free]
    for n in row_0:
        room.drawn_balls.append(n)
        room.last_drawn_ball = n

    # Carlos calls Bingo
    ok, win_type, cand = await room_service.call_bingo(code, p1.id, p1.cards[0].id)
    assert ok is True
    assert win_type == "Linha"
    assert room.active_contest is not None
    assert room.active_contest.status == ContestStatus.WINDOW
    assert len(room.active_contest.candidates) == 1
    assert room.active_contest.candidates[0].player_name == "Carlos"

    # Fast-forward 10s countdown resolution
    await room_service.resolve_contest_window(code)

    # After countdown, Carlos must be awarded the prize
    assert room.active_contest is None
    assert len(room.winners) == 1
    assert room.winners[0].player_name == "Carlos"
    assert room.winners[0].prize_title == "Bicicleta Aro 29"
    assert room.prizes[0].winner_name == "Carlos"

@pytest.mark.asyncio
async def test_multi_player_same_ball_tiebreaker_highest_stone_wins():
    room, host = room_service.create_room(
        host_name="Host 2",
        win_condition=WinCondition.LINE,
        contest_window_seconds=10.0,
        prizes=[{"title": "PlayStation 5"}]
    )
    code = room.code
    _, p1 = room_service.join_room(code, "Alice", card_count=1)
    _, p2 = room_service.join_room(code, "Bob", card_count=1)
    await room_service.start_game(code, host.id)

    # Pick common completing ball
    common_ball = 72
    p1_row = [c.number for c in p1.cards[0].grid[0] if not c.is_free]
    p2_row = [c.number for c in p2.cards[0].grid[0] if not c.is_free]

    # Pre-draw all numbers for both lines except common_ball
    for n in p1_row[:-1]:
        if n not in room.drawn_balls:
            room.drawn_balls.append(n)
    for n in p2_row[:-1]:
        if n not in room.drawn_balls:
            room.drawn_balls.append(n)

    # Override last ball of each row to common_ball for testing identical closing ball
    p1.cards[0].grid[0][-1].number = common_ball
    p2.cards[0].grid[0][-1].number = common_ball

    # Draw common ball
    room.drawn_balls.append(common_ball)
    room.last_drawn_ball = common_ball

    # 1. Alice calls Bingo
    ok1, _, _ = await room_service.call_bingo(code, p1.id, p1.cards[0].id)
    assert ok1 is True
    assert room.active_contest.status == ContestStatus.WINDOW
    assert len(room.active_contest.candidates) == 1

    # 2. Bob also calls Bingo within the 10s countdown window!
    ok2, _, _ = await room_service.call_bingo(code, p2.id, p2.cards[0].id)
    assert ok2 is True
    assert len(room.active_contest.candidates) == 2
    assert {c.player_name for c in room.active_contest.candidates} == {"Alice", "Bob"}

    # 3. Window closes -> Triggers Tiebreaker ("Desempate das Pedras")
    await room_service.resolve_contest_window(code)
    contest = room.active_contest
    assert contest is not None
    assert contest.status == ContestStatus.TIEBREAKER

    # 4. Candidates choose stones
    # Set controlled available stones: [30, 65]
    contest.available_stones = [30, 65]
    
    # Alice picks first (gets 30)
    picked_a = await room_service.pick_contest_stone(code, p1.id)
    assert picked_a is True
    assert contest.candidates[0].chosen_stone == 30

    # Bob picks second (gets 65) -> all picked -> resolves tiebreaker!
    picked_b = await room_service.pick_contest_stone(code, p2.id)
    assert picked_b is True
    assert contest.candidates[1].chosen_stone == 65

    # 5. Bob (65 > 30) MUST be awarded the single prize!
    assert len(room.winners) == 1
    assert room.winners[0].player_name == "Bob"
    assert room.winners[0].prize_title == "PlayStation 5"
    assert room.prizes[0].winner_name == "Bob"

    # Only 1 prize awarded
    awarded_prizes = [p for p in room.prizes if p.winner_name is not None]
    assert len(awarded_prizes) == 1

    # Check game log contains tiebreaker and winner
    tb_logs = [e for e in room.game_log if e.event_type == "bingo_tiebreaker"]
    assert len(tb_logs) == 1
    assert "Bob com a maior pedra (65)" in tb_logs[0].details

    win_logs = [e for e in room.game_log if e.event_type == "bingo_awarded"]
    assert len(win_logs) == 1
    assert win_logs[0].player_name == "Bob"
    assert "desempate da pedra maior (65)" in win_logs[0].details

@pytest.mark.asyncio
async def test_tiebreaker_timeout_auto_picks_stone_for_idle_player():
    room, host = room_service.create_room(
        host_name="Host 3",
        win_condition=WinCondition.LINE,
        contest_window_seconds=10.0,
        prizes=[{"title": "Headset Gamer"}]
    )
    code = room.code
    _, p1 = room_service.join_room(code, "Marcos", card_count=1)
    _, p2 = room_service.join_room(code, "Lucas", card_count=1)
    await room_service.start_game(code, host.id)

    common_ball = 55
    p1.cards[0].grid[0][-1].number = common_ball
    p2.cards[0].grid[0][-1].number = common_ball
    for c in p1.cards[0].grid[0][:-1]:
        if not c.is_free: room.drawn_balls.append(c.number)
    for c in p2.cards[0].grid[0][:-1]:
        if not c.is_free: room.drawn_balls.append(c.number)
    room.drawn_balls.append(common_ball)
    room.last_drawn_ball = common_ball

    await room_service.call_bingo(code, p1.id, p1.cards[0].id)
    await room_service.call_bingo(code, p2.id, p2.cards[0].id)
    await room_service.resolve_contest_window(code)

    contest = room.active_contest
    assert contest.status == ContestStatus.TIEBREAKER

    # Marcos picks stone manually (e.g. 50)
    contest.available_stones = [50, 20]
    await room_service.pick_contest_stone(code, p1.id)
    assert contest.candidates[0].chosen_stone == 50
    assert contest.candidates[1].chosen_stone is None

    # Simulate timeout -> auto picks for Lucas (gets 20)
    await room_service._handle_tiebreaker_timeout(code, contest.id, 0.0)

    # Marcos (50 > 20) wins!
    assert len(room.winners) == 1
    assert room.winners[0].player_name == "Marcos"
