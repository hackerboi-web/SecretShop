from flask import Blueprint, render_template, session, request, flash, redirect, url_for, jsonify
from app.auth import login_required
from app.api.bot_client import bot_api
from app.supabase import get_supabase
import json

user_bp = Blueprint('user', __name__, url_prefix='')

@user_bp.route('/')
def index():
    if 'user' in session:
        return redirect(url_for('user.dashboard'))
    return render_template('index.html')

@user_bp.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user']['id']
    user_data = None
    balance_data = None

    try:
        user_data = bot_api.get_user(user_id)
        balance_data = bot_api.get_user_balance(user_id)
    except Exception as e:
        flash(f'Failed to load dashboard data: {e}', 'error')

    return render_template('user/dashboard.html', user=user_data, balance=balance_data)

@user_bp.route('/shop')
@login_required
def shop():
    try:
        items = bot_api.get_shop_items()
        # Group by category
        categories = {}
        for item in items:
            cat = item.get('category', 'other')
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item)
    except Exception as e:
        flash(f'Failed to load shop: {e}', 'error')
        categories = {}

    return render_template('user/shop.html', categories=categories)

@user_bp.route('/shop/<item_id>')
@login_required
def shop_item(item_id):
    try:
        items = bot_api.get_shop_items()
        item = next((i for i in items if i['item_id'] == item_id), None)
        if not item:
            flash('Item not found', 'error')
            return redirect(url_for('user.shop'))
    except Exception as e:
        flash(f'Failed to load item: {e}', 'error')
        return redirect(url_for('user.shop'))

    return render_template('user/shop_item.html', item=item)

@user_bp.route('/inventory')
@login_required
def inventory():
    user_id = session['user']['id']
    try:
        inv = bot_api.get_inventory(user_id)
        # Enrich with item definitions
        from app.config import Config
        import json
        with open(Config.ITEMS_JSON_PATH) as f:
            items_config = json.load(f)

        for inv_item in inv:
            item_def = items_config['items'].get(inv_item['item_id'])
            if item_def:
                inv_item['item_data'] = item_def
    except Exception as e:
        flash(f'Failed to load inventory: {e}', 'error')
        inv = []

    return render_template('user/inventory.html', inventory=inv)

@user_bp.route('/profile')
@login_required
def profile():
    user_id = session['user']['id']
    user_data = None
    balance_data = None
    try:
        user_data = bot_api.get_user(user_id)
        balance_data = bot_api.get_user_balance(user_id)
    except Exception as e:
        flash(f'Failed to load profile: {e}', 'error')

    return render_template('user/profile.html', user=user_data, balance=balance_data)

@user_bp.route('/transactions')
@login_required
def transactions():
    user_id = session['user']['id']
    page = request.args.get('page', 1, type=int)
    limit = 20
    offset = (page - 1) * limit

    try:
        txs = bot_api.get_transactions(user_id, limit=limit, offset=offset)
        has_more = len(txs) == limit
    except Exception as e:
        flash(f'Failed to load transactions: {e}', 'error')
        txs = []
        has_more = False

    return render_template('user/transactions.html', transactions=txs, page=page, has_more=has_more)

@user_bp.route('/leaderboard')
@login_required
def leaderboard():
    try:
        # Use bot API or direct Supabase query
        from app.supabase import get_supabase
        supabase = get_supabase()
        response = supabase.table('users').select('discord_id, username, balance, avatar_hash').order('balance', desc=True).limit(20).execute()
        leaderboard = response.data or []
    except Exception as e:
        flash(f'Failed to load leaderboard: {e}', 'error')
        leaderboard = []

    return render_template('user/leaderboard.html', leaderboard=leaderboard)

# API endpoints for AJAX
@user_bp.route('/api/balance')
@login_required
def api_balance():
    user_id = session['user']['id']
    try:
        balance_data = bot_api.get_user_balance(user_id)
        return jsonify(balance_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/api/inventory')
@login_required
def api_inventory():
    user_id = session['user']['id']
    try:
        inv = bot_api.get_inventory(user_id)
        return jsonify(inv)
    except Exception as e:
        return jsonify({'error': str(e)}), 500