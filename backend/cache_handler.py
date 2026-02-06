import redis
import json
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class StockCache:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.cache_timeout = timedelta(minutes=15)  # Cache for 15 minutes

    def get_stock_info(self, symbol: str) -> dict:
        try:
            cached_data = self.redis_client.get(f"stock:{symbol}")
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Redis error: {str(e)}")
        return None

    def set_stock_info(self, symbol: str, data: dict):
        try:
            self.redis_client.setex(
                f"stock:{symbol}",
                self.cache_timeout,
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Redis error: {str(e)}")