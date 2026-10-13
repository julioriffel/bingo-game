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
    prize_title: str | None = None
    timestamp: float = Field(default_factory=time.time)

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
    created_at: float = Field(default_factory=time.time)
