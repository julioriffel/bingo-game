import random
import hmac
import hashlib
from typing import Tuple, Optional
from ..config import settings
from ..models.card import BingoCard, BingoCell
from ..models.room import WinCondition, GameStage

COLUMN_RANGES = {
    0: ("B", 1, 15),
    1: ("I", 16, 30),
    2: ("N", 31, 45),
    3: ("G", 46, 60),
    4: ("O", 61, 75),
}

def get_ball_letter(number: int) -> str:
    """Returns the Bingo letter (B, I, N, G, O) for a given ball number."""
    if 1 <= number <= 15:
        return "B"
    elif 16 <= number <= 30:
        return "I"
    elif 31 <= number <= 45:
        return "N"
    elif 46 <= number <= 60:
        return "G"
    elif 61 <= number <= 75:
        return "O"
    raise ValueError(f"Invalid ball number {number}. Must be between 1 and 75.")

def generate_card(card_id: str) -> BingoCard:
    """Generates a standard 75-ball American Bingo card with a central FREE space."""
    # Generate numbers for each column
    columns_data: dict[int, list[int]] = {}
    for col_idx, (_, start, end) in COLUMN_RANGES.items():
        needed = 4 if col_idx == 2 else 5
        nums = random.sample(range(start, end + 1), needed)
        columns_data[col_idx] = nums

    grid: list[list[BingoCell]] = []
    card_numbers_str = []

    for row in range(5):
        row_cells: list[BingoCell] = []
        for col in range(5):
            letter, _, _ = COLUMN_RANGES[col]
            if row == 2 and col == 2:
                # Center FREE space
                cell = BingoCell(
                    number=0,
                    letter=letter,
                    row=row,
                    col=col,
                    is_free=True,
                    marked=True,
                )
                card_numbers_str.append("FREE")
            else:
                # Column index 2 has 4 items, shift row > 2
                list_idx = row if col != 2 or row < 2 else row - 1
                num = columns_data[col][list_idx]
                cell = BingoCell(
                    number=num,
                    letter=letter,
                    row=row,
                    col=col,
                    is_free=False,
                    marked=False,
                )
                card_numbers_str.append(str(num))
            row_cells.append(cell)
        grid.append(row_cells)

    # Compute server HMAC signature for anti-cheat
    content = f"{card_id}:{','.join(card_numbers_str)}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        content.encode(),
        hashlib.sha256
    ).hexdigest()

    return BingoCard(id=card_id, grid=grid, hash=signature)

def check_card_victory(
    card: BingoCard,
    drawn_balls: set[int],
    win_condition: WinCondition,
    current_stage: GameStage,
) -> Tuple[bool, Optional[str]]:
    """
    Validates whether a card meets the required winning condition based on drawn balls.
    Returns (is_winner, win_type).
    """
    # Build 5x5 boolean matrix of marked/drawn cells
    marked = [[False for _ in range(5)] for _ in range(5)]
    for r in range(5):
        for c in range(5):
            cell = card.grid[r][c]
            if cell.is_free or cell.number in drawn_balls:
                marked[r][c] = True

    # 1. Check Full Card / Blackout
    is_blackout = all(all(row) for row in marked)

    # 2. Check Any Line (horizontal, vertical, diagonal)
    has_horizontal = any(all(marked[r][c] for c in range(5)) for r in range(5))
    has_vertical = any(all(marked[r][c] for r in range(5)) for c in range(5))
    has_diag1 = all(marked[i][i] for i in range(5))
    has_diag2 = all(marked[i][4 - i] for i in range(5))
    has_line = has_horizontal or has_vertical or has_diag1 or has_diag2

    if win_condition == WinCondition.LINE:
        if has_line:
            return True, "Linha"
        return False, None

    elif win_condition == WinCondition.BLACKOUT:
        if is_blackout:
            return True, "Cartela Cheia"
        return False, None

    elif win_condition == WinCondition.MULTI_STAGE:
        if current_stage == GameStage.LINE:
            if has_line:
                return True, "Linha"
            return False, None
        elif current_stage == GameStage.BLACKOUT:
            if is_blackout:
                return True, "Cartela Cheia"
            return False, None

    return False, None
