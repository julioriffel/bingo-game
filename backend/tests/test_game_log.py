import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.room_service import room_service
from backend.models.room import WinCondition, DrawMode

client = TestClient(app)

@pytest.mark.asyncio
async def test_game_log_recording_balls_and_winner():
    # 1. Create room
    res = client.post("/api/rooms", json={
        "host_name": "Audit Host",
        "name": "Audit Bingo Room",
        "win_condition": "line",
        "prizes": [{"title": "Cafeteira Express", "description": "15 Bar"}]
    })
    assert res.status_code == 200
    data = res.json()
    code = data["room_code"]
    host_id = data["host_id"]

    # 2. Join player
    _, player = room_service.join_room(code, "Maria Sortuda", card_count=1)
    card = player.cards[0]
    await room_service.start_game(code, host_id)
    room = room_service.get_room(code)

    # 3. Draw 3 random balls via draw_next_ball
    for _ in range(3):
        await room_service.draw_next_ball(code)

    assert len(room.game_log) == 3
    assert room.game_log[0].event_type == "ball_drawn"
    assert room.game_log[0].ball == room.drawn_balls[0]
    assert room.game_log[0].letter is not None

    # 4. Draw remaining numbers needed to complete row 0 of Maria
    row_0_cells = card.grid[0]
    row_0_nums = [c.number for c in row_0_cells if not c.is_free]
    
    # Draw all except last
    for n in row_0_nums[:-1]:
        if n not in room.drawn_balls:
            room.drawn_balls.append(n)
            room.last_drawn_ball = n

    # Draw completing ball
    comp_ball = row_0_nums[-1]
    room.drawn_balls.append(comp_ball)
    room.last_drawn_ball = comp_ball

    # Maria calls Bingo
    ok, win_type, winner = await room_service.call_bingo(code, player.id, card.id)
    assert ok is True
    assert winner.player_name == "Maria Sortuda"
    assert len(winner.winning_numbers) == 5

    # Resolve contest window to award the prize
    await room_service.resolve_contest_window(code)

    # 5. Check game_log for bingo_awarded entry
    win_entries = [e for e in room.game_log if e.event_type == "bingo_awarded"]
    assert len(win_entries) == 1
    win_entry = win_entries[0]
    assert win_entry.player_name == "Maria Sortuda"
    assert win_entry.win_type == "Linha"
    assert win_entry.pattern_name == "Linha 1"
    assert win_entry.prize_title == "Cafeteira Express"
    assert win_entry.on_ball == comp_ball
    assert win_entry.winning_numbers == winner.winning_numbers

    # 6. Verify REST API /api/rooms/{code}/log endpoint
    log_res = client.get(f"/api/rooms/{code}/log")
    assert log_res.status_code == 200
    log_data = log_res.json()
    assert log_data["room_code"] == code
    assert log_data["total_winners"] == 1
    assert any(e["event_type"] == "bingo_awarded" for e in log_data["game_log"])
