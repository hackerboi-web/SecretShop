from flask import Flask
from app.config import Config
from app.auth import auth_bp, login_required, admin_required
from app.user import user_bp
from app.admin import admin_bp
from app.api.bot_client import bot_api
import atexit

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)

    # Validate config
    try:
        Config.validate()
    except ValueError as e:
        print(f'Config warning: {e}')

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)

    # Template globals
    @app.context_processor
    def inject_globals():
        return {
            'current_user': lambda: app.session_interface.get_session_data(),
        }

    # Health check
    @app.route('/health')
    def health():
        return {'status': 'ok'}

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def server_error(e):
        return render_template('errors/500.html'), 500

    # Cleanup on shutdown
    @app.teardown_appcontext
    async def close_bot_client(exception=None):
        await bot_api.close()

    return app

# Import render_template for error handlers
from flask import render_template

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)