from flask import Blueprint, redirect, url_for, session, request, flash, current_app
from requests_oauthlib import OAuth2Session
import os

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

DISCORD_API_BASE = 'https://discord.com/api/v10'
OAUTH_AUTHORIZE_URL = f'{DISCORD_API_BASE}/oauth2/authorize'
OAUTH_TOKEN_URL = f'{DISCORD_API_BASE}/oauth2/token'
OAUTH_USER_URL = f'{DISCORD_API_BASE}/users/@me'
OAUTH_GUILDS_URL = f'{DISCORD_API_BASE}/users/@me/guilds'

def get_oauth_session(token=None, state=None):
    return OAuth2Session(
        client_id=current_app.config['DISCORD_CLIENT_ID'],
        redirect_uri=current_app.config['DISCORD_REDIRECT_URI'],
        scope=['identify', 'guilds'],
        token=token,
        state=state,
    )

@auth_bp.route('/login')
def login():
    discord = get_oauth_session()
    authorization_url, state = discord.authorization_url(OAUTH_AUTHORIZE_URL)
    session['oauth_state'] = state
    return redirect(authorization_url)

@auth_bp.route('/callback')
def callback():
    if request.args.get('error'):
        flash(f'OAuth error: {request.args.get("error_description", request.args["error"])}', 'error')
        return redirect(url_for('auth.login'))

    discord = get_oauth_session(state=session.get('oauth_state'))
    try:
        token = discord.fetch_token(
            OAUTH_TOKEN_URL,
            client_secret=current_app.config['DISCORD_CLIENT_SECRET'],
            authorization_response=request.url,
        )
    except Exception as e:
        flash(f'Failed to fetch token: {e}', 'error')
        return redirect(url_for('auth.login'))

    session['oauth_token'] = token

    # Get user info
    discord = get_oauth_session(token=token)
    user_response = discord.get(OAUTH_USER_URL)
    if not user_response.ok:
        flash('Failed to fetch user info', 'error')
        return redirect(url_for('auth.login'))

    user_data = user_response.json()
    session['user'] = {
        'id': user_data['id'],
        'username': user_data['username'],
        'discriminator': user_data.get('discriminator', '0'),
        'avatar': user_data.get('avatar'),
        'global_name': user_data.get('global_name'),
    }

    # Check if user is admin
    is_admin = check_admin(user_data['id'])
    session['is_admin'] = is_admin

    # Ensure user exists in database
    ensure_user_exists(user_data)

    return redirect(url_for('user.dashboard' if not is_admin else 'admin.dashboard'))

@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully', 'info')
    return redirect(url_for('index'))

def check_admin(discord_id: str) -> bool:
    """Check if user has admin role in the configured guild."""
    from app.api.bot_client import bot_api
    import asyncio

    try:
        # Check via bot API if user has admin role
        # For now, check against configured admin role IDs
        admin_roles = current_app.config.get('ADMIN_ROLE_IDS', set())
        if not admin_roles:
            return False

        # We'd need to check user's roles in the guild
        # This is a simplified check - in production, query bot API
        return False
    except Exception:
        return False

def ensure_user_exists(user_data: dict):
    """Ensure user exists in Supabase."""
    from app.supabase import get_supabase
    supabase = get_supabase()

    supabase.table('users').upsert({
        'discord_id': user_data['id'],
        'username': user_data['username'],
        'avatar_hash': user_data.get('avatar'),
    }, on_conflict='discord_id').execute()

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user' not in session:
            flash('Please log in first', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user' not in session:
            flash('Please log in first', 'warning')
            return redirect(url_for('auth.login'))
        if not session.get('is_admin'):
            flash('Admin access required', 'error')
            return redirect(url_for('user.dashboard'))
        return f(*args, **kwargs)
    return decorated