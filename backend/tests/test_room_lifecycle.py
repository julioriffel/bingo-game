import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.room_service import room_service
from backend.models.room import WinCondition, DrawMode, RoomStatus

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["python_version"] == "3.14"

    res_root = client.get("/health")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "healthy"

    head_res = client.head("/health")
    assert head_res.status_code == 200

def test_create_and_join_room_api():
    # 1. Create Room via API
    res = client.post("/api/rooms", json={
        "host_name": "Julio Host",
        "name": "Bingo Teste",
        "win_condition": "multi_stage",
        "max_cards_per_player": 2,
        "is_public": True,
        "draw_interval": 3.0,
        "draw_mode": "manual"
    })
    assert res.status_code == 200
    created = res.json()
    room_code = created["room_code"]
    assert len(room_code) == 6
    assert "pin" in created
    assert "token" in created

    # 2. List public rooms (Radar)
    radar_res = client.get("/api/rooms")
    assert radar_res.status_code == 200
    rooms = radar_res.json()["rooms"]
    found = next((r for r in rooms if r["code"] == room_code), None)
    assert found is not None
    assert found["host_name"] == "Julio Host"

    # 3. Join Room via API
    join_res = client.post(f"/api/rooms/{room_code}/join", json={
        "player_name": "Ana Jogadora",
        "card_count": 2
    })
    assert join_res.status_code == 200
    joined = join_res.json()
    assert joined["player_name"] == "Ana Jogadora"
    assert len(joined["cards"]) == 2
    assert "token" in joined

@pytest.mark.asyncio
async def test_room_game_lifecycle_and_bingo():
    # 1. Create Room
    room, host = room_service.create_room(
        host_name="Host Mestre",
        win_condition=WinCondition.LINE,
        draw_mode=DrawMode.MANUAL
    )
    code = room.code

    # 2. Join Player
    _, player = room_service.join_room(code, "Jogador 1", card_count=1)
    card = player.cards[0]
    
    # 3. Start Game
    await room_service.start_game(code, host.id)
    assert room.status == RoomStatus.PLAYING

    # 4. Draw balls until row 0 of card is completed
    row_0_numbers = [cell.number for cell in card.grid[0] if not cell.is_free]
    for num in row_0_numbers:
        room.drawn_balls.append(num)
        if num in room.remaining_balls:
            room.remaining_balls.remove(num)

    # 5. Call Bingo
    is_valid, win_type, winner = await room_service.call_bingo(code, player.id, card.id)
    assert is_valid is True
    assert win_type == "Linha"
    assert winner is not None
    assert winner.player_name == "Jogador 1"
