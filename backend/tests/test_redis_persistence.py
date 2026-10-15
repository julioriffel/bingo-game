import pytest
import httpx
from backend.main import app
from backend.services.room_service import room_service
from backend.services.redis_service import redis_service
from backend.models.room import WinCondition

@pytest.mark.asyncio
async def test_redis_persistence_and_reload():
    # 1. Connect to Redis if available, or skip if local Redis is unreachable
    await redis_service.connect()
    if not redis_service.is_connected:
        pytest.skip("Redis não está disponível no ambiente local para este teste.")

    # 2. Create room and join player
    room, host = room_service.create_room(
        host_name="Host Redis",
        name="Sala Redis Reload",
        win_condition=WinCondition.LINE,
        max_cards_per_player=2,
    )
    code = room.code
    _, player = await room_service.join_room_async(
        room_code=code,
        player_name="Jogador Persistente",
        card_count=2,
    )
    player_id = player.id
    token = player.token
    card1 = player.cards[0]
    cell_to_mark = next(c for c in card1.grid[0] if not c.is_free)
    number_to_mark = cell_to_mark.number

    # 3. Mark number on card
    marked = await room_service.mark_number_async(code, player_id, card1.id, number_to_mark)
    assert marked is True

    # 4. Simulate server restart / memory loss: clear in-memory rooms
    assert code in room_service.rooms
    room_service.rooms.pop(code, None)
    assert code not in room_service.rooms

    # 5. Restore room from Redis via get_room_async
    restored_room = await room_service.get_room_async(code)
    assert restored_room is not None
    assert restored_room.code == code
    assert player_id in restored_room.players

    # 6. Verify cards and marks were restored from Redis
    restored_player = restored_room.players[player_id]
    assert len(restored_player.cards) == 2
    restored_card1 = next(c for c in restored_player.cards if c.id == card1.id)
    restored_cell = next(c for row in restored_card1.grid for c in row if c.number == number_to_mark)
    assert restored_cell.marked is True

    # 7. Simulate browser reload reconnecting with token via REST API /join using AsyncClient
    # Wipe memory again to ensure REST API also recovers from Redis!
    room_service.rooms.pop(code, None)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        res_join = await ac.post(f"/api/rooms/{code}/join", json={
            "player_name": "Jogador Persistente",
            "card_count": 2,
            "token": token,
        })
        assert res_join.status_code == 200
        join_data = res_join.json()
        assert join_data["player_id"] == player_id
        assert len(join_data["cards"]) == 2
        assert join_data["cards"][0]["id"] == card1.id
        cell_marked = next(
            c for row in join_data["cards"][0]["grid"] for c in row if c["number"] == number_to_mark
        )
        assert cell_marked["marked"] is True

        # 8. Test dedicated player cards REST endpoint
        res_cards = await ac.get(f"/api/rooms/{code}/players/{player_id}/cards?token={token}")
        assert res_cards.status_code == 200
        cards_data = res_cards.json()
        assert len(cards_data["cards"]) == 2

    # Cleanup in Redis
    await redis_service.delete_room(code, [host.id, player_id])
    await redis_service.close()
