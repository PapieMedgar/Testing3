from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.shop import Shop, shops_schema, shop_schema
from app.models.checkin import CheckIn, CheckInStatus, checkin_schema, checkins_schema
from app.models.visit_response import VisitResponse, VisitType, visit_response_schema, visit_responses_schema
from app.models.goal import Goal, GoalType
from datetime import datetime
from datetime import datetime
import os
import uuid

agent_bp = Blueprint('agent', __name__)

def update_goals_after_checkin(checkin_id: int, is_individual: bool, shop_id: int = None):
    """
    Update related goals after a successful checkin
    """
    now = datetime.utcnow()
    
    # Update individual visit goals
    if is_individual:
        individual_goals = Goal.query.filter(
            Goal.goal_type == GoalType.INDIVIDUAL_VISITS.value,
            Goal.start_date <= now,
            Goal.end_date >= now
        ).all()
        
        for goal in individual_goals:
            goal.current_value += 1
    
    # Update shop visit goals
    if shop_id:
        shop_goals = Goal.query.filter(
            Goal.goal_type == GoalType.SHOP_VISITS.value,
            Goal.start_date <= now,
            Goal.end_date >= now,
            (Goal.shop_id == shop_id) | (Goal.shop_id.is_(None))  # Match specific shop or all shops
        ).all()
        
        for goal in shop_goals:
            goal.current_value += 1
    
    try:
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Error updating goals after checkin: {str(e)}")
        db.session.rollback()

# Debug: Add GET /checkin to verify route registration
@agent_bp.route('/checkin', methods=['GET'], strict_slashes=False)
def checkin_get():
    return 'Checkin GET OK'

def require_agent():
    """Ensure only agents can access routes"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    if not current_user or current_user.role != UserRole.AGENT:
        return jsonify({"error": "Agent access required"}), 403
    return current_user

# View all shops (simplified - no complex assignment logic for now)
@agent_bp.route('/shops', methods=['GET'])
@jwt_required()
def get_shops():
    current_user = require_agent()
    if isinstance(current_user, tuple):  # Error response
        return current_user
    
    # For now, agents can see all shops
    shops = Shop.query.all()
    return shops_schema.jsonify(shops)

# Create new shop
@agent_bp.route('/shops', methods=['POST'])
@jwt_required()
def create_shop():
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Validate required fields
    required_fields = ['name', 'address', 'latitude', 'longitude']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        shop = Shop(
            name=data['name'],
            address=data['address'],
            latitude=float(data['latitude']),
            longitude=float(data['longitude'])
        )
        db.session.add(shop)
        db.session.commit()
        
        return jsonify({
            "message": "Shop created successfully",
            "shop": shop_schema.dump(shop)
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating shop: {str(e)}")
        return jsonify({"error": "Failed to create shop"}), 500

# Checkin functionality

@agent_bp.route('/checkin', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_checkin():
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user

    # Check for photo data - base64 only
    photo_base64 = None
    additional_photos_base64 = []
    
    # Check for base64 encoded images
    if 'photo_base64' in request.form:
        photo_base64 = request.form.get('photo_base64')
    else:
        return jsonify({"error": "No photo_base64 provided. Please ensure images are converted to base64."}), 400
    
    # Check for additional base64 photos
    if 'additional_photos_base64' in request.form:
        import json
        try:
            additional_photos_raw = request.form.get('additional_photos_base64')
            additional_photos_base64 = json.loads(additional_photos_raw)
            if not isinstance(additional_photos_base64, list):
                additional_photos_base64 = [additional_photos_base64]
        except Exception as e:
            return jsonify({"error": f"Invalid additional_photos_base64 format: {str(e)}"}), 400

    # Validate other form data
    shop_id = request.form.get('shop_id')
    notes = request.form.get('notes', '')
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    # New: Accept brand/category/product
    brand_id = request.form.get('brand_id')
    category_id = request.form.get('category_id')
    product_id = request.form.get('product_id')

    # New: Accept survey/visit response data
    visit_type = request.form.get('visit_type')
    responses_raw = request.form.get('responses')

    # Validate all required fields
    missing_fields = []
    if not latitude:
        missing_fields.append('latitude')
    if not longitude:
        missing_fields.append('longitude')
    if visit_type and not responses_raw:
        missing_fields.append('responses')
        
    # For customer visits, require shop_id
    if visit_type == 'customer' and not shop_id:
        missing_fields.append('shop_id')
        
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    # If visit_type is provided, responses must be provided and valid JSON
    if visit_type:
        if visit_type not in ['individual', 'customer']:
            return jsonify({'error': 'Invalid visit_type. Must be individual or customer'}), 400
        import json
        try:
            responses = json.loads(responses_raw)
        except Exception as e:
            return jsonify({'error': f'Invalid responses JSON: {str(e)}'}), 400

    # Handle shop logic for customer visits
    shop = None
    shop_id_for_checkin = None
    
    if visit_type == 'customer':
        new_shop_name = request.form.get('shop_name')
        new_shop_address = request.form.get('shop_address')
        
        if shop_id == 'new' and new_shop_name and new_shop_address:
            # Create new shop
            shop = Shop(
                name=new_shop_name,
                address=new_shop_address,
                latitude=float(latitude),
                longitude=float(longitude)
            )
            db.session.add(shop)
            db.session.flush()  # Get the new shop ID
            shop_id_for_checkin = shop.id
        else:
            # Verify existing shop
            shop = Shop.query.get_or_404(shop_id)
            shop_id_for_checkin = shop.id

    # Handle photo storage - base64 only
    # All images are now stored as base64 in the database
    
    # Prepare additional photos as JSON string if any
    additional_photos_json = None
    if additional_photos_base64:
        import json
        additional_photos_json = json.dumps(additional_photos_base64)

    # Create checkin
    checkin = CheckIn(
        agent_id=current_user.id,
        shop_id=shop_id_for_checkin,  # This will be None for individual visits
        brand_id=int(brand_id) if brand_id else None,
        category_id=int(category_id) if category_id else None,
        product_id=int(product_id) if product_id else None,
        timestamp=datetime.utcnow(),
        latitude=float(latitude),
        longitude=float(longitude),
        photo_path=None,  # No file paths - using base64 only
        photo_base64=photo_base64,  # Always base64 now
        additional_photos_base64=additional_photos_json,
        notes=notes,
        status=CheckInStatus.PENDING
    )
    db.session.add(checkin)
    db.session.flush()  # Get checkin.id before commit

    # If survey data is provided, save visit response
    visit_response_obj = None
    if visit_type and responses_raw:
        visit_response_obj = VisitResponse(
            checkin_id=checkin.id,
            visit_type=VisitType.INDIVIDUAL if visit_type == 'individual' else VisitType.CUSTOMER
        )
        visit_response_obj.set_responses(responses)
        db.session.add(visit_response_obj)

    db.session.commit()
    
    # Update goals after successful checkin
    update_goals_after_checkin(checkin.id, visit_type == 'individual', shop_id_for_checkin)

    result = checkin_schema.dump(checkin)
    if visit_response_obj:
        result['visit_response'] = visit_response_schema.dump(visit_response_obj)

    return jsonify(result), 201

# Serve uploaded files
@agent_bp.route('/uploads/<path:filename>')
def serve_photo(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

# Test endpoint
@agent_bp.route('/test', methods=['GET'])
def test_endpoint():
    return jsonify({'message': 'Test endpoint working'})

# Get products by category
@agent_bp.route('/categories/<int:category_id>/products', methods=['GET'])
@jwt_required()
def get_category_products(category_id):
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
    
    from app.models.product import Product, products_schema
    from app.models.brand import Category
    
    # Check if category exists
    category = Category.query.get_or_404(category_id)
    
    # Get products for this category
    products = Product.query.filter_by(category_id=category_id).all()
    
    return products_schema.jsonify(products)

# Get my manager's information
@agent_bp.route('/my-manager', methods=['GET'])
@jwt_required()
def get_my_manager():
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
        
    if not current_user.manager_id:
        return jsonify({"error": "No manager assigned"}), 404
        
    manager = User.query.get(current_user.manager_id)
    if not manager:
        return jsonify({"error": "Manager not found"}), 404
        
    return jsonify({
        "id": manager.id,
        "name": manager.name,
        "phone": manager.phone,
        "role": manager.role.value,
        "office": "Regional Office"  # This could be added to the User model if needed
    }), 200

# View my checkin history only
@agent_bp.route('/my-checkins', methods=['GET'])
@jwt_required()
def get_my_checkin_history():
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
    
    # Only return this agent's checkins
    checkins = CheckIn.query.filter_by(agent_id=current_user.id).order_by(CheckIn.timestamp.desc()).all()
    
    # Manually serialize without using Marshmallow jsonify
    checkins_data = []
    for checkin in checkins:
        # Get associated shop if there is one
        shop = Shop.query.get(checkin.shop_id) if checkin.shop_id else None
        
        # Convert to dict and manually handle status
        checkin_dict = {
            'id': checkin.id,
            'agent_id': checkin.agent_id,
            'shop_id': checkin.shop_id,  # This will be None for individual visits
            'timestamp': checkin.timestamp.isoformat() if checkin.timestamp else None,
            'latitude': checkin.latitude,
            'longitude': checkin.longitude,
            'photo_path': checkin.photo_path,
            'notes': checkin.notes,
            'status': checkin.status.value if checkin.status else None,
            'shop': {
                'id': shop.id,
                'name': shop.name,
                'address': shop.address,
                'latitude': shop.latitude,
                'longitude': shop.longitude
            } if shop else None  # Will be None for individual visits
        }
        checkins_data.append(checkin_dict)
    
    return jsonify(checkins_data)


# Visit Response Management Routes
@agent_bp.route('/submit_visit_response', methods=['POST'])
@jwt_required()
def submit_visit_response():
    """Submit visit questionnaire response for a checkin"""
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    required_fields = ['checkin_id', 'visit_type', 'responses']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    checkin_id = data['checkin_id']
    visit_type = data['visit_type']
    responses = data['responses']
    
    # Validate visit_type
    if visit_type not in ['individual', 'customer']:
        return jsonify({'error': 'Invalid visit_type. Must be individual or customer'}), 400
    
    # Verify the checkin exists and belongs to the current user
    checkin = CheckIn.query.filter_by(id=checkin_id, agent_id=current_user.id).first()
    if not checkin:
        return jsonify({'error': 'CheckIn not found or access denied'}), 404
    
    # Check if a visit response already exists for this checkin
    existing_response = VisitResponse.query.filter_by(checkin_id=checkin_id).first()
    if existing_response:
        return jsonify({'error': 'Visit response already exists for this checkin'}), 409
    
    try:
        # Create new visit response
        visit_response = VisitResponse(
            checkin_id=checkin_id,
            visit_type=VisitType.INDIVIDUAL if visit_type == 'individual' else VisitType.CUSTOMER
        )
        
        # Set responses using the JSON helper method
        visit_response.set_responses(responses)
        
        db.session.add(visit_response)
        db.session.commit()
        
        return jsonify({
            'message': 'Visit response submitted successfully',
            'visit_response': visit_response_schema.dump(visit_response)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error submitting visit response: {str(e)}")
        return jsonify({'error': 'Failed to submit visit response'}), 500


@agent_bp.route('/get_visit_response/<int:checkin_id>', methods=['GET'])
@jwt_required()
def get_visit_response(checkin_id):
    """Get visit questionnaire response for a specific checkin"""
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
    
    # Verify the checkin exists and belongs to the current user
    checkin = CheckIn.query.filter_by(id=checkin_id, agent_id=current_user.id).first()
    if not checkin:
        return jsonify({'error': 'CheckIn not found or access denied'}), 404
    
    # Get the visit response
    visit_response = VisitResponse.query.filter_by(checkin_id=checkin_id).first()
    if not visit_response:
        return jsonify({'error': 'Visit response not found'}), 404
    
    return jsonify({
        'visit_response': visit_response_schema.dump(visit_response)
    }), 200


@agent_bp.route('/get_all_visit_responses', methods=['GET'])
@jwt_required()
def get_all_visit_responses():
    """Get all visit responses for the current agent"""
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
    
    # Get all checkins for the current user and their associated visit responses
    checkins = CheckIn.query.filter_by(agent_id=current_user.id).all()
    checkin_ids = [checkin.id for checkin in checkins]
    
    visit_responses = VisitResponse.query.filter(VisitResponse.checkin_id.in_(checkin_ids)).all()
    
    return jsonify({
        'visit_responses': visit_responses_schema.dump(visit_responses)
    }), 200


@agent_bp.route('/update_visit_response/<int:checkin_id>', methods=['PUT'])
@jwt_required()
def update_visit_response(checkin_id):
    """Update visit questionnaire response for a specific checkin"""
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Verify the checkin exists and belongs to the current user
    checkin = CheckIn.query.filter_by(id=checkin_id, agent_id=current_user.id).first()
    if not checkin:
        return jsonify({'error': 'CheckIn not found or access denied'}), 404
    
    # Get the visit response
    visit_response = VisitResponse.query.filter_by(checkin_id=checkin_id).first()
    if not visit_response:
        return jsonify({'error': 'Visit response not found'}), 404
    
    try:
        # Update responses if provided
        if 'responses' in data:
            visit_response.set_responses(data['responses'])
        
        # Update visit_type if provided
        if 'visit_type' in data:
            visit_type = data['visit_type']
            if visit_type not in ['individual', 'customer']:
                return jsonify({'error': 'Invalid visit_type. Must be individual or customer'}), 400
            visit_response.visit_type = VisitType.INDIVIDUAL if visit_type == 'individual' else VisitType.CUSTOMER
        
        db.session.commit()
        
        return jsonify({
            'message': 'Visit response updated successfully',
            'visit_response': visit_response_schema.dump(visit_response)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating visit response: {str(e)}")
        return jsonify({'error': 'Failed to update visit response'}), 500


@agent_bp.route('/delete_visit_response/<int:checkin_id>', methods=['DELETE'])
@jwt_required()
def delete_visit_response(checkin_id):
    """Delete visit questionnaire response for a specific checkin"""
    current_user = require_agent()
    if isinstance(current_user, tuple):
        return current_user
    
    # Verify the checkin exists and belongs to the current user
    checkin = CheckIn.query.filter_by(id=checkin_id, agent_id=current_user.id).first()
    if not checkin:
        return jsonify({'error': 'CheckIn not found or access denied'}), 404
    
    # Get the visit response
    visit_response = VisitResponse.query.filter_by(checkin_id=checkin_id).first()
    if not visit_response:
        return jsonify({'error': 'Visit response not found'}), 404
    
    try:
        db.session.delete(visit_response)
        db.session.commit()
        
        return jsonify({'message': 'Visit response deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting visit response: {str(e)}")
        return jsonify({'error': 'Failed to delete visit response'}), 500