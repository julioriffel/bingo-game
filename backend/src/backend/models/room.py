from enum import Enum
from pydantic import BaseModel, Field
import time
from .card import BingoCard

class WinCondition(str, Enum):
    LINE = "line"
    BLACKOUT = "blackout"
    MULTI_STAGE = "multi_stage"

class GameStage(str, Enum):
    WAITING = "waiting"
    LINE = "line"
    BLACKOUT = "blackout"
    COMPLETED = "completed"

class RoomStatus(str, Enum):
    LOBBY = "lobby"
    PLAYING = "playing"
    PAUSED = "paused"
    FINISHED = "finished"

class DrawMode(str, Enum):
    AUTO = "auto"
    MANUAL = "manual"

class Prize(BaseModel):
    id: str
    title: str
    description: str = ""
    order: int = 1
    winner_id: str | None = None
    winner_name: str | None = None
    won_at: float | None = None

class Player(BaseModel):
    id: str
    name: str
    is_host: bool = False
    cards: list[BingoCard] = Field(default_factory=list)
    connected: bool = True
    token: str
    joined_at: float = Field(default_factory=time.time)

class WinnerInfo(BaseModel):
    player_id: str
    player_name: str
    card_id: str
    win_type: str
    drawn_count: int
    pattern_id: str | None = None
    pattern_type: str | None = None
    pattern_name: str | None = None
    line_index: int | None = None
    winning_cells: list[dict] = Field(default_factory=list)
    winning_numbers: list[int | str] = Field(default_factory=list)
    on_ball: int | None = None
    prize_title: str | None = None
    timestamp: float = Field(default_factory=time.time)

class GameLogEntry(BaseModel):
    id: str
    event_type: str  # "ball_drawn" | "bingo_awarded" | "bingo_tiebreaker"
    order: int       # Sequential order: 1, 2, 3...
    timestamp: float = Field(default_factory=time.time)
    ball: int | None = None
    letter: str | None = None
    player_id: str | None = None
    player_name: str | None = None
    card_id: str | None = None
    win_type: str | None = None
    pattern_name: str | None = None
    winning_numbers: list[int | str] = Field(default_factory=list)
    prize_title: str | None = None
    on_ball: int | None = None
    details: str | None = None

class ContestStatus(str, Enum):
    WINDOW = "window"          # Countdown window (10s)
    TIEBREAKER = "tiebreaker"  # Players picking stones
    RESOLVED = "resolved"      # Winner determined

class ContestCandidate(BaseModel):
    player_id: str
    player_name: str
    card_id: str
    win_type: str = "Bingo"
    pattern_id: str | None = None
    pattern_type: str | None = None
    pattern_name: str | None = None
    line_index: int | None = None
    winning_cells: list[dict] = Field(default_factory=list)
    winning_numbers: list[int | str] = Field(default_factory=list)
    chosen_stone: int | None = None
    stone_picked_at: float | None = None
    prize_title: str | None = None

class BingoContest(BaseModel):
    id: str
    ball: int
    target_prize_id: str | None = None
    target_prize_title: str | None = None
    status: ContestStatus = ContestStatus.WINDOW
    duration_seconds: float = 10.0
    window_start_time: float = Field(default_factory=time.time)
    window_end_time: float = Field(default_factory=time.time)
    candidates: list[ContestCandidate] = Field(default_factory=list)
    available_stones: list[int] = Field(default_factory=list)
    winner_player_id: str | None = None

class Room(BaseModel):
    code: str
    pin: str
    name: str
    is_public: bool = True
    host_id: str
    host_name: str
    win_condition: WinCondition = WinCondition.MULTI_STAGE
    max_cards_per_player: int = 4
    draw_interval: float = 5.0
    draw_mode: DrawMode = DrawMode.AUTO
    status: RoomStatus = RoomStatus.LOBBY
    stage: GameStage = GameStage.WAITING
    drawn_balls: list[int] = Field(default_factory=list)
    remaining_balls: list[int] = Field(default_factory=list)
    last_drawn_ball: int | None = None
    players: dict[str, Player] = Field(default_factory=dict)
    winners: list[WinnerInfo] = Field(default_factory=list)
    prizes: list[Prize] = Field(default_factory=list)
    game_log: list[GameLogEntry] = Field(default_factory=list)
    active_contest: BingoContest | None = None
    contest_window_seconds: float = 10.0
    created_at: float = Field(default_factory=time.time)
