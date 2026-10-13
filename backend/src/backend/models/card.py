from pydantic import BaseModel, Field
import time

class BingoCell(BaseModel):
    number: int
    letter: str
    row: int
    col: int
    is_free: bool = False
    marked: bool = False

class BingoCard(BaseModel):
    id: str
    grid: list[list[BingoCell]]  # 5 rows x 5 columns
    hash: str
    claimed_patterns: list[str] = Field(default_factory=list)
    winning_patterns: list[dict] = Field(default_factory=list)
    created_at: float = Field(default_factory=time.time)

    def numbers_set(self) -> set[int]:
        """Returns set of all playable numbers in card (excluding free)."""
        numbers = set()
        for row in self.grid:
            for cell in row:
                if not cell.is_free:
                    numbers.add(cell.number)
        return numbers
