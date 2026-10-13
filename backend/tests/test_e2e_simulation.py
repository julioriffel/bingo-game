import pytest
import asyncio
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.room_service import room_service
from backend.models.room import WinCondition, DrawMode

client = TestClient(app)

@pytest.mark.asyncio
async def test_full_game_simulation():
    # 1. Host creates room
    res = client.post("/api/rooms", json={
        "host_name": "Host TV",
        "name": "Sala E2E Bingo",
        "win_condition": "line",
        "max_cards_per_player": 2,
        "is_public": True,
        "draw_interval": 3.0,
        "draw_mode": "manual",
    })
    assert res.status_code == 200
    room_data = res.json()
    code = room_data["room_code"]
    host_id = room_data["host_id"]

    # 2. Three players join room
    players_joined = []
    for i in range(1, 4):
        p_res = client.post(f"/api/rooms/{code}/join", json={
            "player_name": f"Jogador {i}",
            "card_count": 2,
        })
        assert p_res.status_code == 200
        players_joined.append(p_res.json())

    assert len(players_joined) == 3

    # 3. Host starts game
    room = await room_service.start_game(code, host_id)
    assert room.status.value == "playing"

    # 4. Check player 1's first card and draw the numbers needed for row 0
    p1 = players_joined[0]
    p1_card_dict = p1["cards"][0]
    p1_card_id = p1_card_dict["id"]
    row_0_cells = p1_card_dict["grid"][0]
    row_0_nums = [c["number"] for c in row_0_cells if not c["is_free"]]

    # Draw those numbers
    for n in row_0_nums:
        room.drawn_balls.append(n)
        if n in room.remaining_balls:
            room.remaining_balls.remove(n)

    # 5. Player 1 calls BINGO
    valid, win_type, winner = await room_service.call_bingo(code, p1["player_id"], p1_card_id)
    assert valid is True
    assert win_type == "Linha"
    assert winner.player_name == "Jogador 1"

    await room_service.resolve_contest_window(code)
    assert len(room.winners) == 1
