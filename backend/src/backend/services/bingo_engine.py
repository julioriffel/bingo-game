import random
import hmac
import hashlib
from dataclasses import dataclass, field
from typing import Tuple, Optional, List, Dict, Set
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

@dataclass
class PatternInfo:
    id: str                    # "row_0", "col_2", "diag_main", "diag_anti", "blackout"
    type: str                  # "row", "col", "diag_main", "diag_anti", "blackout"
    name: str                  # "Linha Horizontal 1", "Coluna N", etc.
    line_index: Optional[int]  # 0..4 for row/col, or None
    cells: List[Tuple[int, int]] # [(r, c), ...]
    numbers: Set[int]          # set of non-free numbers in the pattern

@dataclass
class VictoryValidationResult:
    is_winner: bool
    win_type: Optional[str] = None          # "Linha" | "Cartela Cheia"
    pattern_id: Optional[str] = None        # "row_0"
    pattern_type: Optional[str] = None      # "row"
    pattern_name: Optional[str] = None      # "Linha 1"
    line_index: Optional[int] = None        # 0
    winning_cells: List[Dict] = field(default_factory=list) # [{"row": r, "col": c, "number": num}, ...]
    rejection_reason: Optional[str] = None

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

def get_card_patterns(card: BingoCard) -> List[PatternInfo]:
    """Extracts all possible winnable patterns for a standard 5x5 card."""
    patterns: List[PatternInfo] = []

    # 1. 5 Horizontal Rows
    for r in range(5):
        cells = [(r, c) for c in range(5)]
        numbers = {card.grid[r][c].number for c in range(5) if not card.grid[r][c].is_free}
        patterns.append(PatternInfo(
            id=f"row_{r}",
            type="row",
            name=f"Linha {r + 1}",
            line_index=r,
            cells=cells,
            numbers=numbers,
        ))

    # 2. 5 Vertical Columns
    col_letters = ["B", "I", "N", "G", "O"]
    for c in range(5):
        cells = [(r, c) for r in range(5)]
        numbers = {card.grid[r][c].number for r in range(5) if not card.grid[r][c].is_free}
        patterns.append(PatternInfo(
            id=f"col_{c}",
            type="col",
            name=f"Coluna {col_letters[c]}",
            line_index=c,
            cells=cells,
            numbers=numbers,
        ))

    # 3. Main Diagonal (top-left to bottom-right)
    diag_main_cells = [(i, i) for i in range(5)]
    diag_main_numbers = {card.grid[i][i].number for i in range(5) if not card.grid[i][i].is_free}
    patterns.append(PatternInfo(
        id="diag_main",
        type="diag_main",
        name="Diagonal Principal",
        line_index=None,
        cells=diag_main_cells,
        numbers=diag_main_numbers,
    ))

    # 4. Anti Diagonal (top-right to bottom-left)
    diag_anti_cells = [(i, 4 - i) for i in range(5)]
    diag_anti_numbers = {card.grid[i][4 - i].number for i in range(5) if not card.grid[i][4 - i].is_free}
    patterns.append(PatternInfo(
        id="diag_anti",
        type="diag_anti",
        name="Diagonal Secundária",
        line_index=None,
        cells=diag_anti_cells,
        numbers=diag_anti_numbers,
    ))

    # 5. Blackout / Cartela Cheia
    blackout_cells = [(r, c) for r in range(5) for c in range(5)]
    blackout_numbers = {card.grid[r][c].number for r in range(5) for c in range(5) if not card.grid[r][c].is_free}
    patterns.append(PatternInfo(
        id="blackout",
        type="blackout",
        name="Cartela Cheia",
        line_index=None,
        cells=blackout_cells,
        numbers=blackout_numbers,
    ))

    return patterns

def check_card_victory_detailed(
    card: BingoCard,
    drawn_balls: set[int],
    win_condition: WinCondition,
    current_stage: GameStage,
    last_drawn_ball: Optional[int] = None,
    already_claimed: Optional[set[str]] = None,
) -> VictoryValidationResult:
    """
    Strict validation of card victory:
    1. Validates that the winning pattern is fully covered by drawn balls.
    2. Enforces timing rule: the last drawn ball MUST be part of the winning line/pattern,
       meaning the user called Bingo before the next number was drawn.
    3. Prevents duplicate prizes: a line/cartela pattern already awarded cannot receive another prize.
    """
    if already_claimed is None:
        already_claimed = set(card.claimed_patterns) if hasattr(card, "claimed_patterns") else set()

    all_patterns = get_card_patterns(card)

    is_blackout_mode = (
        win_condition == WinCondition.BLACKOUT or
        (win_condition == WinCondition.MULTI_STAGE and current_stage == GameStage.BLACKOUT)
    )

    if is_blackout_mode:
        candidates = [p for p in all_patterns if p.id == "blackout"]
        target_win_type = "Cartela Cheia"
    else:
        # Line mode
        candidates = [p for p in all_patterns if p.id != "blackout"]
        target_win_type = "Linha"

    # Find patterns where all numbers are drawn
    completed_patterns = []
    for p in candidates:
        if all(r == 2 and c == 2 or card.grid[r][c].is_free or card.grid[r][c].number in drawn_balls for r, c in p.cells):
            completed_patterns.append(p)

    if not completed_patterns:
        return VictoryValidationResult(
            is_winner=False,
            rejection_reason="Bingo não confirmado: a cartela não atende aos critérios com as pedras sorteadas."
        )

    # Rule: Prevent duplicate prizes with the same line / blackout
    unclaimed_patterns = [p for p in completed_patterns if p.id not in already_claimed]
    if not unclaimed_patterns:
        return VictoryValidationResult(
            is_winner=False,
            rejection_reason="Esta linha/cartela já foi premiada anteriormente nesta partida!"
        )

    # Rule: The user must call Bingo before the next number is drawn.
    # The last_drawn_ball MUST be one of the numbers completing this pattern.
    if last_drawn_ball is not None:
        fresh_patterns = [p for p in unclaimed_patterns if last_drawn_ball in p.numbers]
        if not fresh_patterns:
            return VictoryValidationResult(
                is_winner=False,
                rejection_reason="Bingo expirado: o número que completou sua vitória foi sorteado em uma rodada anterior e o próximo número já foi chamado!"
            )
        winning_pattern = fresh_patterns[0]
    else:
        winning_pattern = unclaimed_patterns[0]

    winning_cells_data = [
        {"row": r, "col": c, "number": card.grid[r][c].number}
        for r, c in winning_pattern.cells
    ]

    return VictoryValidationResult(
        is_winner=True,
        win_type=target_win_type,
        pattern_id=winning_pattern.id,
        pattern_type=winning_pattern.type,
        pattern_name=winning_pattern.name,
        line_index=winning_pattern.line_index,
        winning_cells=winning_cells_data,
    )

def check_card_victory(
    card: BingoCard,
    drawn_balls: set[int],
    win_condition: WinCondition,
    current_stage: GameStage,
    last_drawn_ball: Optional[int] = None,
    already_claimed: Optional[set[str]] = None,
) -> Tuple[bool, Optional[str]]:
    """Backward-compatible wrapper for check_card_victory_detailed."""
    result = check_card_victory_detailed(
        card=card,
        drawn_balls=drawn_balls,
        win_condition=win_condition,
        current_stage=current_stage,
        last_drawn_ball=last_drawn_ball,
        already_claimed=already_claimed,
    )
    return result.is_winner, result.win_type
