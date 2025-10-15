from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import bcrypt, db
from app.models.user import User, UserRole, user_schema
import random
import string

auth_bp = Blueprint('auth', __name__)

def generate_password(length=6):
    """Generate a random password with letters and numbers"""
    characters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

@auth_bp.route('/debug', methods=['GET'])
def debug():
    """Debug endpoint to check user data"""
    users = User.query.all()
    return jsonify({
        'user_count': len(users),
        'users': [{'phone': u.phone, 'name': u.name, 'active': u.is_active} for u in users]
    })

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or 'password' not in data or ('phone' not in data and 'username' not in data):
        return jsonify({"error": "Phone/username and password are required"}), 400

    identifier = data.get('phone') or data.get('username')
    # Try to find user by phone or username
    user = User.query.filter((User.phone == identifier) | (User.name == identifier)).first()

    if user and user.is_active and bcrypt.check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'access_token': access_token,
            'user': user_schema.dump(user)
        }), 200

    return jsonify({"error": "Invalid phone/username or password"}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(int(current_user_id))
    return user_schema.jsonify(user)

@auth_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_token():
    """Validate if the token is still valid"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if user and user.is_active:
        return jsonify({"valid": True}), 200
    return jsonify({"valid": False}), 401