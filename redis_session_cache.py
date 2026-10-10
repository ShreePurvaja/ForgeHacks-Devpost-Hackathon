import logging
import hashlib
import time
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("RedisSessionCache")

class RedisSessionCache:
    """
    Manages sliding window chat history and TTL Response Cache for patient chatbot sessions.
    - Sliding Window: Maintains last 5 conversation turns to optimize context window cost & latency.
    - TTL Response Cache: Caches identical query responses for 300 seconds (5 minutes) in FastAPI backend.
    """
    
    _in_memory_store: Dict[str, List[Dict[str, str]]] = {}
    _ttl_response_cache: Dict[str, Dict[str, Any]] = {}
    DEFAULT_TTL_SECONDS: int = 300 # 5 Minutes TTL Cache

    @classmethod
    def get_session_history(cls, session_id: str, limit: int = 5) -> List[Dict[str, str]]:
        """Retrieve last N conversation messages for a session."""
        history = cls._in_memory_store.get(session_id, [])
        return history[-limit:]

    @classmethod
    def add_message(cls, session_id: str, role: str, content: str, limit: int = 5):
        """Append a user or assistant message and truncate to sliding window limit."""
        if session_id not in cls._in_memory_store:
            cls._in_memory_store[session_id] = []
            
        cls._in_memory_store[session_id].append({
            "role": role,
            "content": content
        })
        
        # Maintain sliding window of last N messages
        if len(cls._in_memory_store[session_id]) > limit * 2:
            cls._in_memory_store[session_id] = cls._in_memory_store[session_id][-(limit * 2):]

    @classmethod
    def clear_session(cls, session_id: str):
        """Clear conversation history for session."""
        if session_id in cls._in_memory_store:
            del cls._in_memory_store[session_id]

    @classmethod
    def _make_cache_key(cls, patient_id: str, prompt: str, lang: str) -> str:
        prompt_clean = prompt.strip().lower()
        prompt_hash = hashlib.md5(prompt_clean.encode('utf-8')).hexdigest()
        return f"{patient_id}:{lang}:{prompt_hash}"

    @classmethod
    def get_cached_response(cls, patient_id: str, prompt: str, lang: str = "en") -> Tuple[Optional[Dict[str, Any]], int]:
        """
        Check TTL response cache for a fast hit.
        Returns (response_dict, ttl_remaining_seconds).
        """
        cache_key = cls._make_cache_key(patient_id, prompt, lang)
        cached_item = cls._ttl_response_cache.get(cache_key)
        if cached_item:
            now = time.time()
            expires_at = cached_item.get("expires_at", 0)
            if now < expires_at:
                ttl_remaining = int(expires_at - now)
                logger.info(f"⚡ [TTL CACHE HIT] Serving response from cache for key {cache_key} (TTL remaining: {ttl_remaining}s)")
                response_data = dict(cached_item.get("response", {}))
                response_data["cache_hit"] = True
                response_data["ttl_remaining_seconds"] = ttl_remaining
                return response_data, ttl_remaining
            else:
                # Expired cache item
                del cls._ttl_response_cache[cache_key]
        return None, 0

    @classmethod
    def set_cached_response(cls, patient_id: str, prompt: str, lang: str, response: Dict[str, Any], ttl_seconds: int = 300):
        """
        Store response in TTL cache with expiration timestamp.
        """
        cache_key = cls._make_cache_key(patient_id, prompt, lang)
        expires_at = time.time() + ttl_seconds
        cls._ttl_response_cache[cache_key] = {
            "response": response,
            "expires_at": expires_at,
            "ttl_seconds": ttl_seconds
        }
        logger.info(f"💾 [TTL CACHE STORE] Cached response for key {cache_key} (TTL: {ttl_seconds}s)")
