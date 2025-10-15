from flask import Blueprint, request, jsonify
from app.models.user import User, UserRole
from app import db
from app import bcrypt

setup_bp = Blueprint('setup', __name__, url_prefix='/setup')


# Danger: Delete all users (for development/reset only)
@setup_bp.route('/delete-all-users', methods=['POST'])
def delete_all_users():
    try:
        # First, remove all references between users
        User.query.update({
            'created_by': None,
            'manager_id': None
        })
        db.session.commit()
        
        # Now we can safely delete all users
        num_deleted = User.query.delete()
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {num_deleted} users.'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to delete users',
            'details': str(e)
        }), 500


# Danger: Delete ALL data from all tables (for development/reset only)
@setup_bp.route('/delete-all-data', methods=['POST'])
def delete_all_data():
    """
    Delete all data from all tables, handling foreign key constraints in the correct order.
    """
    from app.models.checkin import CheckIn
    from app.models.shop import Shop
    from app.models.user import User
    from app.models.visit_response import VisitResponse
    try:
        # Delete VisitResponses first (depends on CheckIn)
        VisitResponse.query.delete()
        db.session.commit()

        # Delete CheckIns (depends on User, Shop)
        CheckIn.query.delete()
        db.session.commit()

        # Remove user-user references
        User.query.update({
            'created_by': None,
            'manager_id': None
        })
        db.session.commit()

        # Delete Users
        User.query.delete()
        db.session.commit()

        # Delete Shops
        Shop.query.delete()
        db.session.commit()

        return jsonify({
            'message': 'All data deleted from VisitResponse, CheckIn, User, and Shop tables.'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to delete all data',
            'details': str(e)
        }), 500


# Create a separate blueprint for setup operations

@setup_bp.route('/create-admin', methods=['POST'])
def create_admin():
    """
    Temporary endpoint to create the first admin user
    This should be removed after initial setup
    """
    try:
        # Allow creation of multiple admins: only check if phone already exists
        # Get data from request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        phone = data.get('phone')
        password = data.get('password', 'admin123')  # Default password

        if not phone:
            return jsonify({'error': 'Phone number is required'}), 400

        # Validate phone format (basic validation)
        if not phone.startswith('+'):
            return jsonify({'error': 'Phone number must include country code (e.g., +27123456789)'}), 400

        # Check if phone already exists
        existing_user = User.query.filter_by(phone=phone).first()
        if existing_user:
            return jsonify({
                'error': 'User with this phone number already exists',
                'existing_role': existing_user.role.value
            }), 400

        # Create the admin user
        admin_user = User(
            phone=phone,
            password_hash=bcrypt.generate_password_hash(password).decode('utf-8'),
            role=UserRole.ADMIN
        )

        db.session.add(admin_user)
        db.session.commit()

        return jsonify({
            'message': 'Admin user created successfully',
            'user_id': admin_user.id,
            'phone': admin_user.phone,
            'password': password,
            'role': admin_user.role.value,
            'created_at': admin_user.created_at.isoformat(),
            'note': 'Save these credentials! You can now login and create other users.'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to create admin user',
            'details': str(e)
        }), 500

@setup_bp.route('/status', methods=['GET'])
def setup_status():
    """
    Check the current setup status
    """
    try:
        # Count users by role
        admin_count = User.query.filter_by(role=UserRole.ADMIN).count()
        manager_count = User.query.filter_by(role=UserRole.MANAGER).count()
        agent_count = User.query.filter_by(role=UserRole.AGENT).count()
        total_users = User.query.count()
        
        return jsonify({
            'setup_status': 'complete' if admin_count > 0 else 'incomplete',
            'user_counts': {
                'admins': admin_count,
                'managers': manager_count,
                'agents': agent_count,
                'total': total_users
            },
            'needs_admin': admin_count == 0,
            'database_connected': True
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to check setup status',
            'details': str(e),
            'database_connected': False
        }), 500

@setup_bp.route('/reset-admin', methods=['POST'])
def reset_admin():
    """
    Emergency endpoint to reset admin password
    Use with caution!
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        phone = data.get('phone')
        new_password = data.get('new_password')

        if not phone or not new_password:
            return jsonify({'error': 'Phone and new_password are required'}), 400

        # Find the admin user
        admin_user = User.query.filter_by(phone=phone, role=UserRole.ADMIN).first()
        if not admin_user:
            return jsonify({'error': 'Admin user with this phone number not found'}), 404

        # Update password
        admin_user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()

        return jsonify({
            'message': 'Admin password reset successfully',
            'phone': admin_user.phone,
            'new_password': new_password
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to reset admin password',
            'details': str(e)
        }), 500


