import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.room_service import room_service
from backend.models.room import WinCondition, DrawMode

client = TestClient(app)

@pytest.mark.asyncio
async def test_room_with_variable_prizes_and_winner_attribution():
    # 1. Create room with 2 prizes
    prizes_input = [
        {"title": "Cesta de Chocolates", "description": "Deliciosos chocolates artesanais"},
        {"title": "Smart TV 50 pol", "description": "4K UHD com HDR"}
    ]
    res = client.post("/api/rooms", json={
        "host_name": "Host Premiador",
        "name": "Bingo com Prêmios",
        "win_condition": "multi_stage",
        "max_cards_per_player": 2,
        "is_public": True,
        "prizes": prizes_input
    })
    assert res.status_code == 200
    data = res.json()
    code = data["room_code"]
    host_id = data["host_id"]

    # 2. Verify prizes on room details endpoint
    details = client.get(f"/api/rooms/{code}").json()
    assert len(details["prizes"]) == 2
    assert details["prizes"][0]["title"] == "Cesta de Chocolates"
    assert details["prizes"][0]["description"] == "Deliciosos chocolates artesanais"
    assert details["prizes"][0]["winner_name"] is None

    # 3. Add 3rd prize dynamically via REST
    add_res = client.post(f"/api/rooms/{code}/prizes", json={
        "host_id": host_id,
        "title": "Air Fryer Digital",
        "description": "Fritadeira sem óleo 4L"
    })
    assert add_res.status_code == 200
    
    details_updated = client.get(f"/api/rooms/{code}").json()
    assert len(details_updated["prizes"]) == 3

    # 4. Join a player and win
    _, player = room_service.join_room(code, "Vencedor Sortudo", card_count=1)
    card = player.cards[0]
    await room_service.start_game(code, host_id)

    # Complete row 0 to win first prize
    row_0 = [c.number for c in card.grid[0] if not c.is_free]
    room = room_service.get_room(code)
    for num in row_0:
        room.drawn_balls.append(num)

    # Call bingo
    valid, win_type, winner = await room_service.call_bingo(code, player.id, card.id)
    assert valid is True
    assert winner.player_name == "Vencedor Sortudo"
    assert winner.prize_title == "Cesta de Chocolates"

    # Verify first prize now has winner assigned
    assert room.prizes[0].winner_name == "Vencedor Sortudo"
    assert room.prizes[0].winner_id == player.id
    assert room.prizes[0].won_at is not None

    # Verify second prize is still available
    assert room.prizes[1].winner_name is None
