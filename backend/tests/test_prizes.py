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

    # Resolve contest window to award the prize
    await room_service.resolve_contest_window(code)

    # Verify first prize now has winner assigned
    assert room.prizes[0].winner_name == "Vencedor Sortudo"
    assert room.prizes[0].winner_id == player.id
    assert room.prizes[0].won_at is not None

    # Verify second prize is still available
    assert room.prizes[1].winner_name is None

    # 5. Attempting to claim 2nd prize with the SAME winning line MUST be rejected!
    valid_dup, reason_dup, _ = await room_service.call_bingo(code, player.id, card.id)
    assert valid_dup is False
    assert ("não atende aos critérios" in reason_dup) or ("já foi premiada" in reason_dup)

@pytest.mark.asyncio
async def test_last_prize_strictly_requires_cartela_completa():
    # Room with 2 prizes: 1st is Linha, 2nd (Last) is Cartela Completa
    room, host = room_service.create_room(
        host_name="Host Teste",
        win_condition=WinCondition.MULTI_STAGE,
        prizes=[
            {"title": "1º Prêmio: Linha"},
            {"title": "2º Prêmio: Cartela Cheia"}
        ]
    )
    code = room.code
    assert room.prizes[0].target_type == "line"
    assert room.prizes[1].target_type == "blackout"

    _, p1 = room_service.join_room(code, "Jogador 1", card_count=1)
    _, p2 = room_service.join_room(code, "Jogador 2", card_count=1)
    card1 = p1.cards[0]
    card2 = p2.cards[0]

    await room_service.start_game(code, host.id)
    assert room.stage.value == "line"

    # Complete row 0 of card1 to win 1st prize
    row_0_p1 = [c.number for c in card1.grid[0] if not c.is_free]
    for num in row_0_p1:
        room.drawn_balls.append(num)
        room.last_drawn_ball = num

    valid, _, _ = await room_service.call_bingo(code, p1.id, card1.id)
    assert valid is True
    await room_service.resolve_contest_window(code)

    # 1st prize awarded!
    assert room.prizes[0].winner_name == "Jogador 1"
    # Stage MUST advance to blackout because only 1 unawarded prize remains!
    assert room.stage.value == "blackout"

    # Jogador 2 completes a DIFFERENT line (row 0 of card2)
    row_0_p2 = [c.number for c in card2.grid[0] if not c.is_free]
    for num in row_0_p2:
        if num not in room.drawn_balls:
            room.drawn_balls.append(num)
        room.last_drawn_ball = num

    # Jogador 2 tries to claim the last prize with a LINE -> MUST BE REJECTED!
    valid_line, reason_line, _ = await room_service.call_bingo(code, p2.id, card2.id)
    assert valid_line is False
    assert "Cartela Cheia" in reason_line

    # Now draw ALL numbers of card2 for Cartela Completa
    all_p2_nums = [c.number for r in card2.grid for c in r if not c.is_free]
    for num in all_p2_nums:
        if num not in room.drawn_balls:
            room.drawn_balls.append(num)
        room.last_drawn_ball = num

    # Jogador 2 calls bingo with Cartela Completa -> MUST BE ACCEPTED!
    valid_blackout, win_type, winner2 = await room_service.call_bingo(code, p2.id, card2.id)
    assert valid_blackout is True
    assert win_type == "Cartela Cheia"
    await room_service.resolve_contest_window(code)

    assert room.prizes[1].winner_name == "Jogador 2"
    assert room.status.value == "finished"

@pytest.mark.asyncio
async def test_single_prize_room_starts_in_blackout():
    # Room created with single prize in MULTI_STAGE -> The only prize is the last prize!
    room, host = room_service.create_room(
        host_name="Host Unico",
        win_condition=WinCondition.MULTI_STAGE,
        prizes=[{"title": "Grande Prêmio Único"}]
    )
    code = room.code
    assert len(room.prizes) == 1
    assert room.prizes[0].target_type == "blackout"

    _, p1 = room_service.join_room(code, "Jogador Solo", card_count=1)
    card = p1.cards[0]
    await room_service.start_game(code, host.id)

    # Room must start immediately in blackout!
    assert room.stage.value == "blackout"

    # Completing a line must be rejected
    row_0 = [c.number for c in card.grid[0] if not c.is_free]
    for n in row_0:
        room.drawn_balls.append(n)
        room.last_drawn_ball = n
    valid_line, reason_line, _ = await room_service.call_bingo(code, p1.id, card.id)
    assert valid_line is False
    assert "Cartela Cheia" in reason_line

    # Completing the full card must be accepted
    all_nums = [c.number for r in card.grid for c in r if not c.is_free]
    for n in all_nums:
        if n not in room.drawn_balls:
            room.drawn_balls.append(n)
        room.last_drawn_ball = n
    valid_full, win_type, _ = await room_service.call_bingo(code, p1.id, card.id)
    assert valid_full is True
    assert win_type == "Cartela Cheia"
