from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import bcrypt, db
from app.models.user import User, UserRole, user_schema, users_schema
from app.models.shop import Shop, shops_schema, shop_schema
from app.models.checkin import CheckIn, checkins_schema
from app.models.visit_response import VisitResponse, visit_response_schema
import random
import string
import re
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def generate_password(length=6):
    """Generate a random password with letters and numbers"""
    characters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def validate_phone_number(phone):
    """Validate South African phone number format"""
    # Remove spaces, dashes, plus signs
    phone = re.sub(r'[\s\-\+]', '', phone)
    
    # Check if it's a valid SA number (starts with 27 or 0, followed by 9 digits)
    if re.match(r'^(27|0)[0-9]{9}$', phone):
        # Normalize to international format without +
        if phone.startswith('0'):
            phone = '27' + phone[1:]
        return phone
    return None

def require_admin():
    """Decorator to ensure only admins can access routes"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({"error": "Admin access required"}), 403
    return current_user

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user = require_admin()
    if isinstance(current_user, tuple):  # Error response
        return current_user
    
    users = User.query.all()
    return users_schema.jsonify(users)

@admin_bp.route('/managers', methods=['GET'])
@jwt_required()
def get_managers():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    managers = User.query.filter_by(role=UserRole.MANAGER).all()
    return users_schema.jsonify(managers)

@admin_bp.route('/agents', methods=['GET'])
@jwt_required()
def get_agents():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    agents = User.query.filter_by(role=UserRole.AGENT).all()
    return users_schema.jsonify(agents)

@admin_bp.route('/managers', methods=['POST'])
@jwt_required()
def create_manager():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    
    if not data or 'phone' not in data:
        return jsonify({"error": "Phone number is required"}), 400
    
    # Validate and normalize phone number
    phone_number = validate_phone_number(data['phone'])
    if not phone_number:
        return jsonify({"error": "Invalid phone number format"}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(phone=phone_number).first()
    if existing_user:
        return jsonify({"error": "User with this phone number already exists"}), 400
    
    # Use provided password or generate one
    password = data.get('password', generate_password())
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Create new manager
    new_manager = User(
        phone=phone_number,
        password_hash=hashed_password,
        admin_viewable_password=password,  # Store for admin access
        role=UserRole.MANAGER,
        name=data.get('name'),
        created_by=current_user.id,
        is_active=True
    )
    
    db.session.add(new_manager)
    db.session.commit()
    
    return jsonify({
        'user': user_schema.dump(new_manager),
        'generated_password': password,  # Return password for initial setup
        'password_was_generated': 'password' not in data
    }), 201

@admin_bp.route('/agents', methods=['POST'])
@jwt_required()
def create_agent():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    
    if not data or 'phone' not in data or 'manager_id' not in data:
        return jsonify({"error": "Phone number and manager_id are required"}), 400
    
    # Validate manager exists and is a manager
    manager = User.query.get(data['manager_id'])
    if not manager or manager.role != UserRole.MANAGER:
        return jsonify({"error": "Invalid manager ID"}), 400
    
    # Validate and normalize phone number
    phone_number = validate_phone_number(data['phone'])
    if not phone_number:
        return jsonify({"error": "Invalid phone number format"}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(phone=phone_number).first()
    if existing_user:
        return jsonify({"error": "User with this phone number already exists"}), 400
    
    # Use provided password or generate one
    password = data.get('password', generate_password())
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Create new agent
    new_agent = User(
        phone=phone_number,
        password_hash=hashed_password,
        admin_viewable_password=password,  # Store for admin access
        role=UserRole.AGENT,
        name=data.get('name'),
        created_by=current_user.id,
        manager_id=data['manager_id'],
        is_active=True
    )
    
    db.session.add(new_agent)
    db.session.commit()
    
    return jsonify({
        'user': user_schema.dump(new_agent),
        'generated_password': password,  # Return password for initial setup
        'password_was_generated': 'password' not in data
    }), 201

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    user = User.query.get_or_404(user_id)
    
    # Admin cannot modify other admins
    if user.role == UserRole.ADMIN and user.id != current_user.id:
        return jsonify({"error": "Cannot modify other admin accounts"}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    if 'name' in data:
        user.name = data['name']
    
    if 'phone' in data:
        # Validate and normalize phone number
        phone_number = validate_phone_number(data['phone'])
        if not phone_number:
            return jsonify({"error": "Invalid phone number format"}), 400
        
        # Check if phone number is already taken by another user
        existing_user = User.query.filter_by(phone=phone_number).filter(User.id != user_id).first()
        if existing_user:
            return jsonify({"error": "Phone number already exists"}), 400
        
        user.phone = phone_number
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    if 'manager_id' in data and user.role == UserRole.AGENT:
        if data['manager_id'] is None:
            user.manager_id = None
        else:
            manager = User.query.get(data['manager_id'])
            if manager and manager.role == UserRole.MANAGER:
                user.manager_id = data['manager_id']
            else:
                return jsonify({"error": "Invalid manager ID"}), 400
    
    db.session.commit()
    return user_schema.jsonify(user)

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    user = User.query.get_or_404(user_id)
    
    # Admin cannot delete other admins or themselves
    if user.role == UserRole.ADMIN:
        return jsonify({"error": "Cannot delete admin accounts"}), 403
    
    try:
        # First, delete all checkins associated with this user if they are an agent
        if user.role == UserRole.AGENT:
            checkins = CheckIn.query.filter_by(agent_id=user_id).all()
            for checkin in checkins:
                db.session.delete(checkin)
        
        # Delete the user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "User deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete user: {str(e)}"}), 500

@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_user_password(user_id):
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    user = User.query.get_or_404(user_id)
    
    # Admin cannot reset other admin passwords
    if user.role == UserRole.ADMIN and user.id != current_user.id:
        return jsonify({"error": "Cannot reset other admin passwords"}), 403
    
    # Generate new password
    new_password = generate_password()
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.password_hash = hashed_password
    
    db.session.commit()
    
    return jsonify({
        'message': 'Password reset successfully',
        'new_password': new_password
    }), 200

# Shop CRUD Operations  
@admin_bp.route('/shops', methods=['GET'])
@jwt_required()
def get_shops():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    shops = Shop.query.all()
    return shops_schema.jsonify(shops)

@admin_bp.route('/shops', methods=['POST'])
@jwt_required()
def create_shop():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    
    new_shop = Shop(
        name=data['name'],
        address=data['address'],
        latitude=data['latitude'],
        longitude=data['longitude']
    )
    
    db.session.add(new_shop)
    db.session.commit()
    
    return shop_schema.jsonify(new_shop), 201

@admin_bp.route('/shops/<int:shop_id>', methods=['PUT'])
@jwt_required()
def update_shop(shop_id):
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    shop = Shop.query.get_or_404(shop_id)
    data = request.get_json()
    
    shop.name = data.get('name', shop.name)
    shop.address = data.get('address', shop.address)
    shop.longitude = data.get('longitude', shop.longitude)
    
    db.session.commit()
    
    return shop_schema.jsonify(shop)

@admin_bp.route('/shops/<int:shop_id>', methods=['DELETE'])
@jwt_required()
def delete_shop(shop_id):
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    shop = Shop.query.get_or_404(shop_id)
    
    db.session.delete(shop)
    db.session.commit()
    
    return jsonify({"message": "Shop deleted successfully"}), 200

# Checkin Data
@admin_bp.route('/checkins', methods=['GET'])
@jwt_required()
def get_all_checkins():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    from app.models.visit_response import VisitResponse, visit_response_schema
    
    # Get query parameters for filtering
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    agent_id = request.args.get('agent_id')
    visit_type = request.args.get('visit_type')
    
    # Build the base query
    query = CheckIn.query
    
    # Apply filters
    if start_date:
        query = query.filter(CheckIn.timestamp >= start_date)
    if end_date:
        query = query.filter(CheckIn.timestamp <= end_date)
    if agent_id:
        query = query.filter(CheckIn.agent_id == agent_id)
    
    # Execute query and get checkins
    checkins = query.order_by(CheckIn.timestamp.desc()).all()
    
    # Format the response with checkin data and related data
    result = []
    for checkin in checkins:
        checkin_data = checkins_schema.dump([checkin])[0]
        
        # Add photo data - prioritize base64 if available
        if checkin.photo_base64:
            checkin_data['photo_base64'] = checkin.photo_base64
        elif checkin.photo_path:
            # For backward compatibility, generate URL for file-based photos
            checkin_data['photo_url'] = f"/uploads/{checkin.photo_path}"
        
        # Add additional photos if available
        if checkin.additional_photos_base64:
            import json
            try:
                checkin_data['additional_photos_base64'] = json.loads(checkin.additional_photos_base64)
            except:
                # If JSON parsing fails, include as is
                checkin_data['additional_photos_base64'] = checkin.additional_photos_base64
        
        # Get visit response if exists
        visit_response = VisitResponse.query.filter_by(checkin_id=checkin.id).first()
        if visit_response:
            checkin_data['visit_response'] = visit_response_schema.dump(visit_response)
            
            # Apply visit_type filter if specified
            if visit_type and visit_response.visit_type.value != visit_type:
                continue
        
        # Get shop data if exists
        if checkin.shop_id:
            shop = Shop.query.get(checkin.shop_id)
            if shop:
                checkin_data['shop'] = shop_schema.dump(shop)
        
        # Get agent data
        agent = User.query.get(checkin.agent_id)
        if agent:
            checkin_data['agent'] = user_schema.dump(agent)
            
        # Get brand, category, product data if available
        if checkin.brand_id:
            try:
                from app.models.brand import Brand
                brand = Brand.query.get(checkin.brand_id)
                if brand:
                    checkin_data['brand'] = {
                        'id': brand.id,
                        'name': brand.name
                    }
            except Exception as e:
                print(f"Error fetching brand: {e}")
                
        if checkin.category_id:
            try:
                from app.models.brand import Category
                category = Category.query.get(checkin.category_id)
                if category:
                    checkin_data['category'] = {
                        'id': category.id,
                        'name': category.name
                    }
            except Exception as e:
                print(f"Error fetching category: {e}")
                
        if checkin.product_id:
            try:
                from app.models.brand import Product
                product = Product.query.get(checkin.product_id)
                if product:
                    checkin_data['product'] = {
                        'id': product.id,
                        'name': product.name,
                        'description': product.description
                    }
            except Exception as e:
                print(f"Error fetching product: {e}")
        
        result.append(checkin_data)
    
    return jsonify(result), 200

# Get checkins for a specific agent
@admin_bp.route('/agents/<int:agent_id>/checkins', methods=['GET'])
@jwt_required()
def get_agent_checkins(agent_id):
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    from app.models.visit_response import VisitResponse, visit_response_schema
    
    # Verify the agent exists
    agent = User.query.filter_by(id=agent_id, role=UserRole.AGENT).first()
    if not agent:
        return jsonify({"error": "Agent not found"}), 404
    
    # Get all checkins for this agent
    checkins = CheckIn.query.filter_by(agent_id=agent_id).order_by(CheckIn.timestamp.desc()).all()
    
    # Format the response with checkin data and related visit response data
    result = []
    for checkin in checkins:
        checkin_data = checkins_schema.dump([checkin])[0]
        
        # Add photo data - prioritize base64 if available
        if checkin.photo_base64:
            checkin_data['photo_base64'] = checkin.photo_base64
        elif checkin.photo_path:
            # For backward compatibility, generate URL for file-based photos
            checkin_data['photo_url'] = f"/uploads/{checkin.photo_path}"
        
        # Add additional photos if available
        if checkin.additional_photos_base64:
            import json
            try:
                checkin_data['additional_photos_base64'] = json.loads(checkin.additional_photos_base64)
            except:
                # If JSON parsing fails, include as is
                checkin_data['additional_photos_base64'] = checkin.additional_photos_base64
        
        # Get visit response if exists
        visit_response = VisitResponse.query.filter_by(checkin_id=checkin.id).first()
        if visit_response:
            checkin_data['visit_response'] = visit_response_schema.dump(visit_response)
        
        # Get shop data if exists
        if checkin.shop_id:
            shop = Shop.query.get(checkin.shop_id)
            if shop:
                checkin_data['shop'] = shop_schema.dump(shop)
                
        # Get brand, category, product data if available
        if checkin.brand_id:
            try:
                from app.models.brand import Brand
                brand = Brand.query.get(checkin.brand_id)
                if brand:
                    checkin_data['brand'] = {
                        'id': brand.id,
                        'name': brand.name
                    }
            except Exception as e:
                print(f"Error fetching brand: {e}")
                
        if checkin.category_id:
            try:
                from app.models.brand import Category
                category = Category.query.get(checkin.category_id)
                if category:
                    checkin_data['category'] = {
                        'id': category.id,
                        'name': category.name
                    }
            except Exception as e:
                print(f"Error fetching category: {e}")
                
        if checkin.product_id:
            try:
                from app.models.brand import Product
                product = Product.query.get(checkin.product_id)
                if product:
                    checkin_data['product'] = {
                        'id': product.id,
                        'name': product.name,
                        'description': product.description
                    }
            except Exception as e:
                print(f"Error fetching product: {e}")
        
        result.append(checkin_data)
    
    return jsonify(result), 200

@admin_bp.route('/export-checkins', methods=['GET'])
@jwt_required()
def export_checkins():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    from app.models.visit_response import VisitResponse
    from datetime import datetime
    
    # Get query parameters for filtering
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    agent_id = request.args.get('agent_id')
    
    # Build the base query
    query = CheckIn.query
    
    # Apply filters
    if start_date:
        try:
            start_date = datetime.fromisoformat(start_date)
            query = query.filter(CheckIn.timestamp >= start_date)
        except ValueError:
            pass
    if end_date:
        try:
            end_date = datetime.fromisoformat(end_date)
            query = query.filter(CheckIn.timestamp <= end_date)
        except ValueError:
            pass
    if agent_id:
        query = query.filter(CheckIn.agent_id == agent_id)
    
    # Execute query and get checkins
    checkins = query.order_by(CheckIn.timestamp.desc()).all()
    
    # Format the response for CSV export
    result = []
    for checkin in checkins:
        # Get visit response if exists
        visit_response = VisitResponse.query.filter_by(checkin_id=checkin.id).first()
        visit_type = None
        responses = {}
        if visit_response:
            visit_type = visit_response.visit_type
            responses = visit_response.get_responses()
        
        # Get shop data if exists
        shop_name = None
        shop_address = None
        if checkin.shop_id:
            shop = Shop.query.get(checkin.shop_id)
            if shop:
                shop_name = shop.name
                shop_address = shop.address
        
        # Get agent data
        agent_name = None
        agent = User.query.get(checkin.agent_id)
        if agent:
            agent_name = agent.name or agent.phone
            
        # Get brand, category, product data if available
        brand_name = None
        category_name = None
        product_name = None
        
        # Try to get brand data
        if checkin.brand_id:
            try:
                from app.models.brand import Brand
                brand = Brand.query.get(checkin.brand_id)
                if brand:
                    brand_name = brand.name
            except Exception as e:
                print(f"Error fetching brand: {e}")
                
        # Try to get category data
        if checkin.category_id:
            try:
                from app.models.brand import Category
                category = Category.query.get(checkin.category_id)
                if category:
                    category_name = category.name
            except Exception as e:
                print(f"Error fetching category: {e}")
                
        # Try to get product data
        if checkin.product_id:
            try:
                from app.models.brand import Product
                product = Product.query.get(checkin.product_id)
                if product:
                    product_name = product.name
            except Exception as e:
                print(f"Error fetching product: {e}")
        
        # Format for CSV
        checkin_data = {
            'id': checkin.id,
            'agent_id': checkin.agent_id,
            'agent_name': agent_name,
            'timestamp': checkin.timestamp.isoformat(),
            'latitude': checkin.latitude,
            'longitude': checkin.longitude,
            'status': checkin.status.value,
            'visit_type': visit_type.value if visit_type else None,
            'shop_id': checkin.shop_id,
            'shop_name': shop_name,
            'shop_address': shop_address,
            'brand_id': checkin.brand_id,
            'brand_name': brand_name,
            'category_id': checkin.category_id,
            'category_name': category_name,
            'product_id': checkin.product_id,
            'product_name': product_name,
            'notes': checkin.notes
        }
        
        # Add response data if available
        if responses:
            # Handle nested objects by flattening them for CSV
            for key, value in responses.items():
                if isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, dict):
                            # Further flatten if needed
                            for third_key, third_value in sub_value.items():
                                checkin_data[f"{key}_{sub_key}_{third_key}"] = str(third_value)
                        else:
                            checkin_data[f"{key}_{sub_key}"] = str(sub_value)
                else:
                    checkin_data[key] = str(value)
        
        result.append(checkin_data)
    
    return jsonify(result), 200

# User Credentials Management
@admin_bp.route('/users/<int:user_id>/credentials', methods=['GET'])
@jwt_required()
def get_user_credentials(user_id):
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # For security, we can't decrypt the password, but we can show basic info
    return jsonify({
        'user_id': user.id,
        'phone': user.phone,
        'name': user.name,
        'role': user.role.value,
        'password': user.admin_viewable_password,
        'has_password': bool(user.password_hash),
        'created_at': user.created_at.isoformat() if user.created_at else None
    }), 200

@admin_bp.route('/users/<int:user_id>/edit-password', methods=['POST'])
@jwt_required()
def edit_user_password(user_id):
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    
    if not data or 'password' not in data:
        return jsonify({"error": "Password is required"}), 400
    
    new_password = data['password']
    if not new_password.strip():
        return jsonify({"error": "Password cannot be empty"}), 400
    
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    
    user.password_hash = hashed_password
    user.admin_viewable_password = new_password  # Update admin viewable password
    db.session.commit()
    
    return jsonify({
        'message': 'Password updated successfully',
        'new_password': new_password
    }), 200

# Migration route to update existing users with viewable passwords
@admin_bp.route('/migrate-passwords', methods=['POST'])
@jwt_required()
def migrate_passwords():
    current_user = require_admin()
    if isinstance(current_user, tuple):
        return current_user
    
    # Find users without admin_viewable_password
    users_to_update = User.query.filter(User.admin_viewable_password == None).all()
    updated_count = 0
    
    for user in users_to_update:
        # Generate a new password for users who don't have one
        new_password = generate_password()
        user.admin_viewable_password = new_password
        user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        updated_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': f'Updated {updated_count} users with viewable passwords',
        'updated_count': updated_count
    }), 200