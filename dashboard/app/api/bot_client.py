import httpx
import jwt
import time
from pathlib import Path
from app.config import Config

class BotApiClient:
    def __init__(self):
        self.base_url = Config.BOT_API_URL.rstrip('/')
        self.shared_secret = Config.DASHBOARD_SHARED_SECRET
        self._token: str | None = None
        self._token_expires: float = 0
        self._client = httpx.AsyncClient(timeout=30.0)

    async def _get_token(self) -> str:
        """Get valid JWT token, refreshing if needed."""
        now = time.time()
        if self._token and now < self._token_expires - 60:  # Refresh 1 min before expiry
            return self._token

        # Request new token from bot
        response = await self._client.post(
            f'{self.base_url}/api/auth/token',
            json={'shared_secret': self.shared_secret}
        )
        response.raise_for_status()
        data = response.json()
        self._token = data['access_token']
        self._token_expires = now + data['expires_in']
        return self._token

    async def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        token = await self._get_token()
        headers = kwargs.pop('headers', {})
        headers['Authorization'] = f'Bearer {token}'
        headers['Content-Type'] = 'application/json'

        response = await self._client.request(method, f'{self.base_url}{path}', headers=headers, **kwargs)

        # If token expired, refresh once and retry
        if response.status_code == 401:
            self._token = None
            token = await self._get_token()
            headers['Authorization'] = f'Bearer {token}'
            response = await self._client.request(method, f'{self.base_url}{path}', headers=headers, **kwargs)

        return response

    # User endpoints
    async def get_user(self, discord_id: str) -> dict | None:
        response = await self._request('GET', f'/api/users/{discord_id}')
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    async def get_user_balance(self, discord_id: str) -> dict | None:
        response = await self._request('GET', f'/api/users/{discord_id}/balance')
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    # Economy admin
    async def adjust_balance(self, user_id: str, amount: int, reason: str, reference_id: str | None = None) -> dict:
        response = await self._request('POST', '/api/economy/adjust', json={
            'user_id': user_id,
            'amount': amount,
            'reason': reason,
            'reference_id': reference_id,
        })
        response.raise_for_status()
        return response.json()

    # Shop
    async def get_shop_items(self) -> list[dict]:
        response = await self._request('GET', '/api/shop/items')
        response.raise_for_status()
        return response.json()

    # Inventory
    async def get_inventory(self, user_id: str) -> list[dict]:
        response = await self._request('GET', f'/api/inventory/{user_id}')
        response.raise_for_status()
        return response.json()

    async def add_inventory_item(self, user_id: str, item_id: str, quantity: int = 1, metadata: dict | None = None) -> dict:
        response = await self._request('POST', '/api/inventory/add', json={
            'user_id': user_id,
            'item_id': item_id,
            'quantity': quantity,
            'metadata': metadata or {},
        })
        response.raise_for_status()
        return response.json()

    # Transactions
    async def get_transactions(self, user_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
        response = await self._request('GET', f'/api/transactions/{user_id}', params={'limit': limit, 'offset': offset})
        response.raise_for_status()
        return response.json()

    # Config
    async def get_config(self) -> dict:
        response = await self._request('GET', '/api/config')
        response.raise_for_status()
        return response.json()

    async def set_config(self, key: str, value: dict, description: str | None = None) -> dict:
        response = await self._request('POST', '/api/config', json={'key': key, 'value': value, 'description': description})
        response.raise_for_status()
        return response.json()

    # Shop sync
    async def sync_shop_items(self) -> dict:
        response = await self._request('POST', '/api/shop/sync')
        response.raise_for_status()
        return response.json()

    async def close(self):
        await self._client.aclose()

# Global instance
bot_api = BotApiClient()