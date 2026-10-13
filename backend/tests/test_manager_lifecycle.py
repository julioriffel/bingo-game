import time
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.room_service import room_service
from backend.models.room import WinCondition, DrawMode

client = TestClient(app)

def test_manager_not_counted_in_players():
    # 1. Create Room via API
    res = client.post("/api/rooms", json={
        "host_name": "Gerente Carlos",
        "name": "Sala do Carlos",
        "win_condition": "multi_stage",
        "max_cards_per_player": 2,
    })
    assert res.status_code == 200
    created = res.json()
    code = created["room_code"]
    host_id = created["host_id"]

    # Manager alone should mean player_count is 0
    room_data = client.get(f"/api/rooms/{code}").json()
    assert room_data["player_count"] == 0
    assert room_data["host_id"] == host_id
    assert room_data["host_name"] == "Gerente Carlos"

    # Radar list should also show 0 players
    radar = client.get("/api/rooms").json()["rooms"]
    found = next(r for r in radar if r["code"] == code)
    assert found["player_count"] == 0

    # Check /users endpoint
    users_resp = client.get(f"/api/rooms/{code}/users").json()
    assert users_resp["player_count"] == 0
    assert len(users_resp["users"]) == 1
    assert users_resp["users"][0]["role"] == "manager"
    assert users_resp["users"][0]["name"] == "Gerente Carlos"
    assert users_resp["users"][0]["is_host"] is True

    # 2. Player joins
    join_res = client.post(f"/api/rooms/{code}/join", json={
        "player_name": "Jogador Pedro",
        "card_count": 2,
    })
    assert join_res.status_code == 200
    player_data = join_res.json()
    assert player_data["is_host"] is False

    # player_count is now 1 (only Pedro, Carlos is manager)
    room_data_after = client.get(f"/api/rooms/{code}").json()
    assert room_data_after["player_count"] == 1

    users_after = client.get(f"/api/rooms/{code}/users").json()
    assert users_after["player_count"] == 1
    roles = {u["name"]: u["role"] for u in users_after["users"]}
    assert roles["Gerente Carlos"] == "manager"
    assert roles["Jogador Pedro"] == "player"

@pytest.mark.asyncio
async def test_manager_cannot_call_bingo():
    room, host = room_service.create_room(
        host_name="Host Boss",
        win_condition=WinCondition.LINE,
        draw_mode=DrawMode.MANUAL
    )
    code = room.code
    # Host trying to call bingo
    valid, reason, _ = await room_service.call_bingo(code, host.id, "fake_card")
    assert valid is False
    assert "Manager" in reason

@pytest.mark.asyncio
async def test_claim_manager_inactivity_rule():
    room, host = room_service.create_room(
        host_name="Host Original",
        win_condition=WinCondition.LINE,
    )
    code = room.code

    # Join player
    _, player = room_service.join_room(code, "Substituto Lucas", card_count=1)

    # 1. Host is active (< 120s elapsed) -> claim should fail
    with pytest.raises(ValueError) as exc:
        await room_service.claim_manager(code, player.id, threshold_seconds=120.0)
    assert "2 minutos de inatividade" in str(exc.value)

    # 2. Simulate host inactive for 121 seconds
    room.manager_last_active_at = time.time() - 121.0
    assert room.is_manager_inactive(120.0) is True

    # 3. Now player can claim management
    room, new_mgr = await room_service.claim_manager(code, player.id, threshold_seconds=120.0)
    assert room.host_id == player.id
    assert room.host_name == "Substituto Lucas"
    assert new_mgr.is_host is True
    assert room.players[host.id].is_host is False

    # Check game log has transfer entry
    transfer_log = next((e for e in room.game_log if e.event_type == "manager_transferred"), None)
    assert transfer_log is not None
    assert "Substituto Lucas" in transfer_log.details

@pytest.mark.asyncio
async def test_claim_manager_via_rest_api():
    res = client.post("/api/rooms", json={
        "host_name": "Host Antigo",
        "name": "Sala Inativa",
    })
    code = res.json()["room_code"]

    join_res = client.post(f"/api/rooms/{code}/join", json={
        "player_name": "Novo Lider",
        "card_count": 1,
    })
    player_id = join_res.json()["player_id"]

    # Active attempt fails
    claim_fail = client.post(f"/api/rooms/{code}/claim-manager", json={"player_id": player_id})
    assert claim_fail.status_code == 400
    assert "inatividade" in claim_fail.json()["detail"]

    # Simulate 125 seconds inactive on server
    room = room_service.get_room(code)
    room.manager_last_active_at = time.time() - 125.0

    # Claim via API succeeds
    claim_ok = client.post(f"/api/rooms/{code}/claim-manager", json={"player_id": player_id})
    assert claim_ok.status_code == 200
    data = claim_ok.json()
    assert data["success"] is True
    assert data["host_id"] == player_id
    assert data["host_name"] == "Novo Lider"
