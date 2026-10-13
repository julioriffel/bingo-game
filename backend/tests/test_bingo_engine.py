import pytest
from backend.services.bingo_engine import generate_card, check_card_victory, get_ball_letter, COLUMN_RANGES
from backend.models.room import WinCondition, GameStage

def test_get_ball_letter():
    assert get_ball_letter(1) == "B"
    assert get_ball_letter(15) == "B"
    assert get_ball_letter(16) == "I"
    assert get_ball_letter(30) == "I"
    assert get_ball_letter(31) == "N"
    assert get_ball_letter(45) == "N"
    assert get_ball_letter(46) == "G"
    assert get_ball_letter(60) == "G"
    assert get_ball_letter(61) == "O"
    assert get_ball_letter(75) == "O"
    with pytest.raises(ValueError):
        get_ball_letter(0)
    with pytest.raises(ValueError):
        get_ball_letter(76)

def test_generate_card_structure():
    card = generate_card("card-test-1")
    assert card.id == "card-test-1"
    assert len(card.grid) == 5
    assert all(len(row) == 5 for row in card.grid)
    
    # Center cell is FREE
    center = card.grid[2][2]
    assert center.is_free is True
    assert center.number == 0
    assert center.marked is True
    assert center.letter == "N"

    # Column ranges check
    for r in range(5):
        for c in range(5):
            cell = card.grid[r][c]
            letter, start, end = COLUMN_RANGES[c]
            assert cell.letter == letter
            if not cell.is_free:
                assert start <= cell.number <= end

    # Check distinct numbers per card
    numbers = card.numbers_set()
    assert len(numbers) == 24

def test_check_card_victory_horizontal_line():
    card = generate_card("c-horiz")
    # Draw all numbers from row 0
    drawn = {card.grid[0][c].number for c in range(5)}
    
    # Win condition LINE
    win, win_type = check_card_victory(card, drawn, WinCondition.LINE, GameStage.LINE)
    assert win is True
    assert win_type == "Linha"

    # Win condition BLACKOUT with only 1 row drawn should fail
    win_b, _ = check_card_victory(card, drawn, WinCondition.BLACKOUT, GameStage.BLACKOUT)
    assert win_b is False

def test_check_card_victory_diagonal():
    card = generate_card("c-diag")
    # Draw all numbers on main diagonal (except center which is FREE)
    drawn = {card.grid[i][i].number for i in range(5) if not card.grid[i][i].is_free}
    win, win_type = check_card_victory(card, drawn, WinCondition.LINE, GameStage.LINE)
    assert win is True
    assert win_type == "Linha"

def test_check_card_victory_blackout():
    card = generate_card("c-blackout")
    drawn = card.numbers_set()
    win, win_type = check_card_victory(card, drawn, WinCondition.BLACKOUT, GameStage.BLACKOUT)
    assert win is True
    assert win_type == "Cartela Cheia"

def test_check_card_victory_multistage():
    card = generate_card("c-multi")
    # Draw only row 1
    drawn_line = {card.grid[1][c].number for c in range(5)}
    win_line, t_line = check_card_victory(card, drawn_line, WinCondition.MULTI_STAGE, GameStage.LINE)
    assert win_line is True
    assert t_line == "Linha"

    # In stage BLACKOUT, only having 1 line is not enough
    win_bo, _ = check_card_victory(card, drawn_line, WinCondition.MULTI_STAGE, GameStage.BLACKOUT)
    assert win_bo is False

    # Draw remaining numbers
    drawn_all = card.numbers_set()
    win_bo_full, t_bo = check_card_victory(card, drawn_all, WinCondition.MULTI_STAGE, GameStage.BLACKOUT)
    assert win_bo_full is True
    assert t_bo == "Cartela Cheia"
