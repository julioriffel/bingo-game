import json
import logging
import asyncio
from typing import Callable, Any, Optional
import redis.asyncio as aioredis
from ..config import settings

logger = logging.getLogger(__name__)

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

redis_service = RedisService()
