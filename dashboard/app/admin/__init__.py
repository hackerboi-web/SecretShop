from flask import Blueprint, render_template, session, request, flash, redirect, url_for, jsonify
from app.auth import admin_required
from app.api.bot_client import bot_api
from app.supabase import get_supabase
from app.config import Config
import json

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/')
@admin_required
def dashboard():
    stats = {}
    try:
        supabase = get_supabase()
        # Total users
        stats['total_users'] = supabase.table('users').select('discord_id', count='exact').execute().count or 0
        # Total balance
        balance_res = supabase.table('users').select('balance').execute()
        stats['total_balance'] = sum(u['balance'] for u in (balance_res.data or []))
        # Total transactions
        stats['total_transactions'] = supabase.table('transactions').select('id', count='exact').execute().count or 0
        # Shop items
        stats['shop_items'] = supabase.table('shop_items').select('item_id', count='exact').eq('is_active', True).execute().count or 0
    except Exception as e:
        flash(f'Failed to load stats: {e}', 'error')

    return render_template('admin/dashboard.html', stats=stats)

@admin_bp.route('/config')
@admin_required
def config():
    try:
        bot_config = bot_api.get_config()
    except Exception as e:
        flash(f'Failed to load config: {e}', 'error')
        bot_config = {}

    return render_template('admin/config.html', config=bot_config)

@admin_bp.route('/config', methods=['POST'])
@admin_required
def config_update():
    key = request.form.get('key')
    value_str = request.form.get('value')
    description = request.form.get('description')

    try:
        value = json.loads(value_str) if value_str else {}
        bot_api.set_config(key, value, description)
        flash('Config updated', 'success')
    except json.JSONDecodeError:
        flash('Invalid JSON value', 'error')
    except Exception as e:
        flash(f'Failed to update config: {e}', 'error')

    return redirect(url_for('admin.config'))

@admin_bp.route('/users')
@admin_required
def users():
    page = request.args.get('page', 1, type=int)
    limit = 20
    offset = (page - 1) * limit
    search = request.args.get('search', '')

    try:
        supabase = get_supabase()
        query = supabase.table('users').select('*').order('balance', desc=True)
        if search:
            query = query.ilike('username', f'%{search}%')
        response = query.range(offset, offset + limit - 1).execute()
        users = response.data or []
        has_more = len(users) == limit
    except Exception as e:
        flash(f'Failed to load users: {e}', 'error')
        users = []
        has_more = False

    return render_template('admin/users.html', users=users, page=page, has_more=has_more, search=search)

@admin_bp.route('/users/<discord_id>')
@admin_required
def user_detail(discord_id):
    try:
        user_data = bot_api.get_user(discord_id)
        balance_data = bot_api.get_user_balance(discord_id)
        inventory = bot_api.get_inventory(discord_id)
        transactions = bot_api.get_transactions(discord_id, limit=20)

        # Enrich inventory
        with open(Config.ITEMS_JSON_PATH) as f:
            items_config = json.load(f)
        for inv_item in inventory:
            item_def = items_config['items'].get(inv_item['item_id'])
            if item_def:
                inv_item['item_data'] = item_def
    except Exception as e:
        flash(f'Failed to load user: {e}', 'error')
        return redirect(url_for('admin.users'))

    return render_template('admin/user_detail.html', user=user_data, balance=balance_data, inventory=inventory, transactions=transactions)

@admin_bp.route('/users/<discord_id>/adjust', methods=['POST'])
@admin_required
def adjust_balance(discord_id):
    amount = request.form.get('amount', type=int)
    reason = request.form.get('reason', 'Admin adjustment')
    reference_id = request.form.get('reference_id')

    try:
        bot_api.adjust_balance(discord_id, amount, reason, reference_id)
        flash(f'Adjusted balance by {amount:+d} pts', 'success')
    except Exception as e:
        flash(f'Failed to adjust balance: {e}', 'error')

    return redirect(url_for('admin.user_detail', discord_id=discord_id))

@admin_bp.route('/users/<discord_id>/add_item', methods=['POST'])
@admin_required
def add_item(discord_id):
    item_id = request.form.get('item_id')
    quantity = request.form.get('quantity', 1, type=int)

    try:
        bot_api.add_inventory_item(discord_id, item_id, quantity)
        flash(f'Added {quantity}x {item_id}', 'success')
    except Exception as e:
        flash(f'Failed to add item: {e}', 'error')

    return redirect(url_for('admin.user_detail', discord_id=discord_id))

@admin_bp.route('/shop')
@admin_required
def shop():
    try:
        items = bot_api.get_shop_items()
    except Exception as e:
        flash(f'Failed to load shop: {e}', 'error')
        items = []

    return render_template('admin/shop.html', items=items)

@admin_bp.route('/shop/sync', methods=['POST'])
@admin_required
def shop_sync():
    try:
        result = bot_api.sync_shop_items()
        flash(f'Synced {result.get("synced", 0)} items', 'success')
    except Exception as e:
        flash(f'Failed to sync shop: {e}', 'error')

    return redirect(url_for('admin.shop'))

@admin_bp.route('/shop/item/<item_id>', methods=['GET', 'POST'])
@admin_required
def shop_item(item_id):
    if request.method == 'POST':
        # Update item via Supabase directly
        try:
            supabase = get_supabase()
            updates = {
                'name': request.form.get('name'),
                'description': request.form.get('description'),
                'price': int(request.form.get('price', 0)),
                'category': request.form.get('category'),
                'role_id': request.form.get('role_id') or None,
                'consumable': 'consumable' in request.form,
                'max_per_user': int(request.form.get('max_per_user')) if request.form.get('max_per_user') else None,
                'cooldown_seconds': int(request.form.get('cooldown_seconds', 0)),
                'is_active': 'is_active' in request.form,
                'sort_order': int(request.form.get('sort_order', 0)),
            }
            # Handle metadata JSON
            metadata_str = request.form.get('metadata', '{}')
            updates['metadata'] = json.loads(metadata_str)

            supabase.table('shop_items').update(updates).eq('item_id', item_id).execute()
            flash('Item updated', 'success')
        except Exception as e:
            flash(f'Failed to update item: {e}', 'error')

        return redirect(url_for('admin.shop'))

    # GET - show edit form
    try:
        items = bot_api.get_shop_items()
        item = next((i for i in items if i['item_id'] == item_id), None)
        if not item:
            flash('Item not found', 'error')
            return redirect(url_for('admin.shop'))
    except Exception as e:
        flash(f'Failed to load item: {e}', 'error')
        return redirect(url_for('admin.shop'))

    return render_template('admin/shop_item.html', item=item)

@admin_bp.route('/shop/new', methods=['GET', 'POST'])
@admin_required
def shop_new():
    if request.method == 'POST':
        try:
            supabase = get_supabase()
            item_data = {
                'item_id': request.form.get('item_id'),
                'name': request.form.get('name'),
                'description': request.form.get('description'),
                'price': int(request.form.get('price', 0)),
                'category': request.form.get('category'),
                'role_id': request.form.get('role_id') or None,
                'consumable': 'consumable' in request.form,
                'max_per_user': int(request.form.get('max_per_user')) if request.form.get('max_per_user') else None,
                'cooldown_seconds': int(request.form.get('cooldown_seconds', 0)),
                'is_active': 'is_active' in request.form,
                'sort_order': int(request.form.get('sort_order', 0)),
                'metadata': json.loads(request.form.get('metadata', '{}')),
            }
            supabase.table('shop_items').insert(item_data).execute()
            flash('Item created', 'success')
            return redirect(url_for('admin.shop'))
        except Exception as e:
            flash(f'Failed to create item: {e}', 'error')

    return render_template('admin/shop_item.html', item=None)

@admin_bp.route('/analytics')
@admin_required
def analytics():
    # Basic analytics data
    analytics_data = {}
    try:
        supabase = get_supabase()

        # Daily active users (last 7 days)
        # Transactions by type
        tx_types = supabase.table('transactions').select('type').execute()
        type_counts = {}
        for t in (tx_types.data or []):
            type_counts[t['type']] = type_counts.get(t['type'], 0) + 1
        analytics_data['transaction_types'] = type_counts

        # Top items purchased
        purchases = supabase.table('transactions').select('item_id, quantity').eq('type', 'purchase').execute()
        item_counts = {}
        for p in (purchases.data or []):
            if p['item_id']:
                item_counts[p['item_id']] = item_counts.get(p['item_id'], 0) + p['quantity']
        analytics_data['top_items'] = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        # Balance distribution
        users = supabase.table('users').select('balance').execute()
        balances = [u['balance'] for u in (users.data or [])]
        analytics_data['balance_stats'] = {
            'total': sum(balances),
            'average': sum(balances) / len(balances) if balances else 0,
            'max': max(balances) if balances else 0,
            'median': sorted(balances)[len(balances)//2] if balances else 0,
        }
    except Exception as e:
        flash(f'Failed to load analytics: {e}', 'error')

    return render_template('admin/analytics.html', analytics=analytics_data)