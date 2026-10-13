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
                    socket_connect_timeout=2.0
                )
                await self.redis.ping()
                self.is_connected = True
                logger.info("Connected to Redis at %s", settings.REDIS_URL)
            except Exception as e:
                logger.warning("Could not connect to Redis: %s. Using in-memory fallback.", e)
                self.is_connected = False
                self.redis = None
        else:
            logger.info("Redis disabled via config. Using in-memory Pub/Sub fallback.")
            self.is_connected = False

    async def close(self):
        if self.redis:
            await self.redis.close()
            self.is_connected = False

    async def publish(self, channel: str, message: dict[str, Any]):
        """Publish a JSON message to a Redis channel or in-memory subscribers."""
        payload_str = json.dumps(message)
        if self.is_connected and self.redis:
            try:
                await self.redis.publish(channel, payload_str)
            except Exception as e:
                logger.error("Error publishing to Redis: %s", e)

        # Always trigger local listeners
        if channel in self._local_subscribers:
            for callback in self._local_subscribers[channel]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(message)
                    else:
                        callback(message)
                except Exception as e:
                    logger.error("Error in local subscriber: %s", e)

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
