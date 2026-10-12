from supabase import create_client, Client
from app.config import Config

_supabase: Client | None = None

def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase

# Type definitions for database records
class DbUser:
    discord_id: str
    username: str
    avatar_hash: str | None
    balance: int
    total_earned: int
    total_spent: int
    daily_streak: int
    last_daily: str | None
    last_chest: str | None
    last_digsite: str | None
    created_at: str
    updated_at: str

class DbInventoryItem:
    id: int
    user_id: str
    item_id: str
    quantity: int
    metadata: dict
    acquired_at: str

class DbShopItem:
    item_id: str
    name: str
    description: str | None
    price: int
    currency_type: str
    category: str
    role_id: str | None
    consumable: bool
    max_per_user: int | None
    cooldown_seconds: int
    metadata: dict
    is_active: bool
    sort_order: int
    created_at: str
    updated_at: str

class DbTransaction:
    id: int
    user_id: str | None
    type: str
    amount: int
    balance_after: int
    item_id: str | None
    quantity: int
    reference_id: str | None
    metadata: dict
    created_at: str