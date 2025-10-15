from flask import Flask
from flask.json.provider import DefaultJSONProvider
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
import enum
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
ma = Marshmallow()
bcrypt = Bcrypt()
jwt = JWTManager()

class CustomJSONProvider(DefaultJSONProvider):
    """Custom JSON provider that handles enums"""
    def default(self, obj):
        if isinstance(obj, enum.Enum):
            return obj.value
        return super().default(obj)

def create_app():
    app = Flask(__name__)
    
    # Use custom JSON provider for enum handling
    app.json = CustomJSONProvider(app)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key')
    # Require DATABASE_URI for production
    db_uri = os.getenv('DATABASE_URI')
    if not db_uri:
        raise RuntimeError('DATABASE_URI environment variable must be set for production!')
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev_jwt_secret_key')
    # Set token expiration to 24 hours (86400 seconds)
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', './uploads')
    # Allow up to 20MB per request (adjust as needed)
    app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024
    
    # Enable CORS for all routes with proper preflight handling
    CORS(app, resources={r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "send_wildcard": False
    }})
    
    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    # Add OPTIONS method handler for all routes
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Import models to ensure they are registered
    from . import models
    
    # Import and register blueprints
    from .routes.auth import auth_bp
    from .routes.admin import admin_bp
    from .routes.manager import manager_bp
    from .routes.agent import agent_bp
    from .routes.setup import setup_bp
    from .routes.goals import goals
    from .routes.brand import brand_bp
    from .routes.brands import brands_bp
    from .routes.test import test_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(manager_bp, url_prefix='/api/manager')
    app.register_blueprint(agent_bp, url_prefix='/api/agent')
    app.register_blueprint(goals, url_prefix='/api/goals', strict_slashes=False)
    app.register_blueprint(brand_bp, url_prefix='/api')
    app.register_blueprint(brands_bp, url_prefix='/api/brands')
    app.register_blueprint(test_bp, url_prefix='/api/test')
    # Register setup blueprint with no extra prefix (it already has /setup)
    app.register_blueprint(setup_bp)

    return app