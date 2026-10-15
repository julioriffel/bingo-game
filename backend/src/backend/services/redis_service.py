import json
import logging
import asyncio
from typing import Callable, Any, Optional, List
import redis.asyncio as aioredis
from ..config import settings
from ..models.room import Room
from ..models.card import BingoCard

logger = logging.getLogger(__name__)

ROOM_KEY_PREFIX = "bingo:room:"
PLAYER_CARDS_PREFIX = "bingo:cards:"
PLAYER_TOKEN_PREFIX = "bingo:token:"
DEFAULT_TTL_SECONDS = 86400  # 24 hours


class RedisService:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.is_connected: bool = False
        self._local_subscribers: dict[str, list[Callable[[dict[str, Any]], Any]]] = {}

    async def connect(self):
        if settings.USE_REDIS:
            try:
                self.redis = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2.0,
                    socket_timeout=3.0,
                )
                await self.redis.ping()
                self.is_connected = True
                logger.info("Connected to Redis at %s", settings.REDIS_URL)
            except (aioredis.RedisError, ConnectionError, OSError) as err:
                logger.warning(
                    "Could not connect to Redis: %s. Using in-memory Pub/Sub fallback.",
                    err,
                    extra={"redis_url": settings.REDIS_URL}
                )
                self.is_connected = False
                self.redis = None
        else:
            logger.info("Redis disabled via config. Using in-memory Pub/Sub fallback.")
            self.is_connected = False

    async def close(self):
        if self.redis:
            try:
                if hasattr(self.redis, "aclose"):
                    await self.redis.aclose()
                else:
                    await self.redis.close()
            except Exception as err:
                logger.warning("Error closing Redis connection: %s", err)
            finally:
                self.is_connected = False
                self.redis = None

    async def publish(self, channel: str, message: dict[str, Any]):
        """Publish a JSON message to a Redis channel or in-memory subscribers."""
        payload_str = json.dumps(message)
        if self.is_connected and self.redis:
            try:
                await self.redis.publish(channel, payload_str)
            except (aioredis.RedisError, ConnectionError, OSError) as err:
                logger.warning(
                    "Failed to publish to Redis channel '%s': %s. Operating in local degraded mode.",
                    channel,
                    err
                )
                self.is_connected = False

        # Always trigger local listeners
        if channel in self._local_subscribers:
            for callback in list(self._local_subscribers[channel]):
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(message)
                    else:
                        callback(message)
                except Exception as e:
                    logger.error(
                        "Error in local subscriber callback for channel '%s': %s",
                        channel,
                        e,
                        exc_info=True
                    )

    def subscribe_local(self, channel: str, callback: Callable[[dict[str, Any]], Any]):
        """Register a local callback for channel messages."""
        if channel not in self._local_subscribers:
            self._local_subscribers[channel] = []
        if callback not in self._local_subscribers[channel]:
            self._local_subscribers[channel].append(callback)

    def unsubscribe_local(self, channel: str, callback: Callable[[dict[str, Any]], Any]):
        if channel in self._local_subscribers:
            if callback in self._local_subscribers[channel]:
                self._local_subscribers[channel].remove(callback)

    async def save_room(self, room: Room) -> bool:
        """Persists entire room and its players/cards into Redis with TTL."""
        if not (self.is_connected and self.redis):
            return False
        try:
            room_json = room.model_dump_json()
            pipe = self.redis.pipeline()
            # 1. Save room master record
            pipe.set(f"{ROOM_KEY_PREFIX}{room.code}", room_json, ex=DEFAULT_TTL_SECONDS)
            # 2. Save individual player cards and token lookups
            for player in room.players.values():
                cards_json = json.dumps([c.model_dump() for c in player.cards])
                pipe.set(
                    f"{PLAYER_CARDS_PREFIX}{room.code}:{player.id}",
                    cards_json,
                    ex=DEFAULT_TTL_SECONDS
                )
                if player.token:
                    token_info = json.dumps({"room_code": room.code, "player_id": player.id})
                    pipe.set(
                        f"{PLAYER_TOKEN_PREFIX}{player.token}",
                        token_info,
                        ex=DEFAULT_TTL_SECONDS
                    )
            await pipe.execute()
            return True
        except (aioredis.RedisError, ConnectionError, OSError) as err:
            logger.warning(
                "Failed to save room '%s' to Redis: %s",
                room.code,
                err,
                extra={"room_code": room.code}
            )
            return False

    async def get_room(self, room_code: str) -> Optional[Room]:
        """Loads room from Redis if present."""
        if not (self.is_connected and self.redis):
            return None
        try:
            data = await self.redis.get(f"{ROOM_KEY_PREFIX}{room_code.upper()}")
            if not data:
                return None
            return Room.model_validate_json(data)
        except (aioredis.RedisError, ConnectionError, OSError) as err:
            logger.warning(
                "Failed to load room '%s' from Redis: %s",
                room_code,
                err,
                extra={"room_code": room_code}
            )
            return None

    async def save_player_cards(self, room_code: str, player_id: str, cards: List[BingoCard]) -> bool:
        """Updates individual player cards in Redis (e.g., when markings change)."""
        if not (self.is_connected and self.redis):
            return False
        try:
            cards_json = json.dumps([c.model_dump() for c in cards])
            await self.redis.set(
                f"{PLAYER_CARDS_PREFIX}{room_code.upper()}:{player_id}",
                cards_json,
                ex=DEFAULT_TTL_SECONDS
            )
            return True
        except (aioredis.RedisError, ConnectionError, OSError) as err:
            logger.warning(
                "Failed to save player cards in Redis: %s",
                err,
                extra={"room_code": room_code, "player_id": player_id}
            )
            return False

    async def get_player_cards(self, room_code: str, player_id: str) -> Optional[List[BingoCard]]:
        """Loads player cards from Redis."""
        if not (self.is_connected and self.redis):
            return None
        try:
            data = await self.redis.get(f"{PLAYER_CARDS_PREFIX}{room_code.upper()}:{player_id}")
            if not data:
                return None
            raw_list = json.loads(data)
            return [BingoCard.model_validate(item) for item in raw_list]
        except (aioredis.RedisError, ConnectionError, OSError) as err:
            logger.warning(
                "Failed to load player cards from Redis: %s",
                err,
                extra={"room_code": room_code, "player_id": player_id}
            )
            return None

    async def get_token_session(self, token: str) -> Optional[dict[str, str]]:
        """Resolves room_code and player_id by player token."""
        if not (self.is_connected and self.redis):
            return None
        try:
            data = await self.redis.get(f"{PLAYER_TOKEN_PREFIX}{token}")
            if not data:
                return None
            return json.loads(data)
        except (aioredis.RedisError, ConnectionError, OSError) as err:
            logger.warning("Failed to lookup token in Redis: %s", err)
            return None

    async def delete_room(self, room_code: str, player_ids: Optional[List[str]] = None) -> bool:
        """Removes room and related player cards from Redis."""
        if not (self.is_connected and self.redis):
            return False
        try:
            keys_to_del = [f"{ROOM_KEY_PREFIX}{room_code.upper()}"]
            if player_ids:
                for pid in player_ids:
                    keys_to_del.append(f"{PLAYER_CARDS_PREFIX}{room_code.upper()}:{pid}")
            await self.redis.delete(*keys_to_del)
            return True
        except (aioredis.RedisError, ConnectionError, OSError) as err:
            logger.warning("Failed to delete room '%s' from Redis: %s", room_code, err)
            return False

    async def get_all_room_codes(self) -> List[str]:
        """Returns list of active room codes in Redis."""
        if not (self.is_connected and self.redis):
            return []
        try:
            keys = await self.redis.keys(f"{ROOM_KEY_PREFIX}*")
            return [k.replace(ROOM_KEY_PREFIX, "") for k in keys]
        except (aioredis.RedisError, ConnectionError, OSError) as err:
            logger.warning("Failed to list room codes from Redis: %s", err)
            return []


redis_service = RedisService()
