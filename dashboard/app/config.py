import os
from pathlib import Path

class Config:
    # Flask
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-change-in-production')
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600

    # Discord OAuth2
    DISCORD_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID')
    DISCORD_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET')
    DISCORD_REDIRECT_URI = os.environ.get('OAUTH2_REDIRECT_URI', 'http://localhost:5000/auth/callback')
    DISCORD_API_BASE = 'https://discord.com/api/v10'

    # Supabase
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    # Bot API
    BOT_API_URL = os.environ.get('BOT_API_URL', 'http://localhost:3001')
    DASHBOARD_SHARED_SECRET = os.environ.get('DASHBOARD_SHARED_SECRET')

    # Items config
    ITEMS_JSON_PATH = Path(__file__).parent.parent.parent / 'bot' / 'items.json'

    # Admin role IDs (from bot config, comma-separated)
    ADMIN_ROLE_IDS = set(os.environ.get('ADMIN_ROLE_IDS', '').split(',')) if os.environ.get('ADMIN_ROLE_IDS') else set()

    @staticmethod
    def validate():
        required = [
            'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET',
            'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
            'BOT_API_URL', 'DASHBOARD_SHARED_SECRET', 'FLASK_SECRET_KEY'
        ]
        missing = [k for k in required if not getattr(Config, k)]
        if missing:
            raise ValueError(f'Missing required config: {", ".join(missing)}')