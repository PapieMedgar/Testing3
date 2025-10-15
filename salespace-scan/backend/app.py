import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import Base, User, Shop, Visit, Goal, Brand, Category, Product
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import datetime
import json

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/salespace')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize extensions
CORS(app, resources={r"/api/*": {"origins": os.environ.get('CORS_ORIGINS', '*')}})
jwt = JWTManager(app)

# Create database engine and session
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
Session = sessionmaker(bind=engine)

# Import CLI commands
from init_db import init_db_command
app.cli.add_command(init_db_command)

# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    
    if not phone or not password:
        return jsonify({"error": "Phone and password are required"}), 400
    
    session = Session()
    try:
        user = session.query(User).filter_by(phone=phone).first()
        
        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid credentials"}), 401
        
        if not user.is_active:
            return jsonify({"error": "Account is inactive"}), 403
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user.id,
                "phone": user.phone,
                "role": user.role,
                "name": user.name,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat(),
                "manager_id": user.manager_id
            }
        })
    finally:
        session.close()

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    session = Session()
    try:
        user = session.query(User).get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "id": user.id,
            "phone": user.phone,
            "role": user.role,
            "name": user.name,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "manager_id": user.manager_id
        })
    finally:
        session.close()

@app.route('/api/auth/validate', methods=['GET'])
@jwt_required()
def validate_token():
    return jsonify({"valid": True})

# User routes
@app.route('/api/users/managers', methods=['GET'])
@jwt_required()
def get_managers():
    session = Session()
    try:
        managers = session.query(User).filter_by(role='MANAGER', is_active=True).all()
        return jsonify([{
            "id": manager.id,
            "phone": manager.phone,
            "name": manager.name,
            "created_at": manager.created_at.isoformat()
        } for manager in managers])
    finally:
        session.close()

@app.route('/api/users/agents', methods=['GET'])
@jwt_required()
def get_agents():
    session = Session()
    try:
        agents = session.query(User).filter_by(role='AGENT', is_active=True).all()
        return jsonify([{
            "id": agent.id,
            "phone": agent.phone,
            "name": agent.name,
            "manager_id": agent.manager_id,
            "created_at": agent.created_at.isoformat()
        } for agent in agents])
    finally:
        session.close()

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_all_users():
    session = Session()
    try:
        users = session.query(User).filter_by(is_active=True).all()
        return jsonify([{
            "id": user.id,
            "phone": user.phone,
            "role": user.role,
            "name": user.name,
            "manager_id": user.manager_id,
            "created_at": user.created_at.isoformat()
        } for user in users])
    finally:
        session.close()

# Shop routes
@app.route('/api/shops', methods=['GET'])
@jwt_required()
def get_shops():
    session = Session()
    try:
        shops = session.query(Shop).all()
        return jsonify([{
            "id": shop.id,
            "name": shop.name,
            "address": shop.address,
            "latitude": shop.latitude,
            "longitude": shop.longitude,
            "phone": shop.phone,
            "email": shop.email,
            "owner_name": shop.owner_name
        } for shop in shops])
    finally:
        session.close()

# Visit routes
@app.route('/api/visits/agent/<int:agent_id>', methods=['GET'])
@jwt_required()
def get_agent_visits(agent_id):
    session = Session()
    try:
        visits = session.query(Visit).filter_by(agent_id=agent_id).all()
        return jsonify([{
            "id": visit.id,
            "shop_id": visit.shop_id,
            "shop": {
                "id": visit.shop.id,
                "name": visit.shop.name,
                "address": visit.shop.address
            } if visit.shop else None,
            "agent_id": visit.agent_id,
            "timestamp": visit.timestamp.isoformat(),
            "notes": visit.notes,
            "status": visit.status,
            "photo_path": visit.photo_path,
            "additional_photos": json.loads(visit.additional_photos) if visit.additional_photos else [],
            "brand_id": visit.brand_id,
            "brand": {
                "id": visit.brand.id,
                "name": visit.brand.name
            } if visit.brand else None
        } for visit in visits])
    finally:
        session.close()

@app.route('/api/visits', methods=['GET'])
@jwt_required()
def get_all_visits():
    session = Session()
    try:
        visits = session.query(Visit).all()
        return jsonify([{
            "id": visit.id,
            "shop_id": visit.shop_id,
            "shop": {
                "id": visit.shop.id,
                "name": visit.shop.name,
                "address": visit.shop.address
            } if visit.shop else None,
            "agent_id": visit.agent_id,
            "agent": {
                "id": visit.agent.id,
                "phone": visit.agent.phone,
                "name": visit.agent.name
            } if visit.agent else None,
            "timestamp": visit.timestamp.isoformat(),
            "notes": visit.notes,
            "status": visit.status,
            "photo_path": visit.photo_path,
            "additional_photos": json.loads(visit.additional_photos) if visit.additional_photos else [],
            "brand_id": visit.brand_id,
            "brand": {
                "id": visit.brand.id,
                "name": visit.brand.name
            } if visit.brand else None
        } for visit in visits])
    finally:
        session.close()

@app.route('/api/visits', methods=['POST'])
@jwt_required()
def create_visit():
    data = request.json
    session = Session()
    try:
        visit = Visit(
            shop_id=data.get('shop_id'),
            agent_id=data.get('agent_id'),
            notes=data.get('notes'),
            status='PENDING',
            photo_path=data.get('photo_path'),
            additional_photos=json.dumps(data.get('additional_photos', [])),
            brand_id=data.get('brand_id')
        )
        session.add(visit)
        session.commit()
        
        # Update goal progress if applicable
        if data.get('agent_id'):
            agent_goals = session.query(Goal).filter_by(
                user_id=data.get('agent_id'),
                status='in_progress'
            ).all()
            
            for goal in agent_goals:
                if goal.goal_type in ['individual_visits', 'shop_visits', 'daily_visits', 'weekly_visits', 'monthly_visits']:
                    goal.current_value += 1
            
            session.commit()
        
        return jsonify({
            "id": visit.id,
            "shop_id": visit.shop_id,
            "agent_id": visit.agent_id,
            "timestamp": visit.timestamp.isoformat(),
            "notes": visit.notes,
            "status": visit.status,
            "photo_path": visit.photo_path,
            "additional_photos": json.loads(visit.additional_photos) if visit.additional_photos else [],
            "brand_id": visit.brand_id
        })
    finally:
        session.close()

# Goal routes
@app.route('/api/goals', methods=['GET'])
@jwt_required()
def get_goals():
    session = Session()
    try:
        goals = session.query(Goal).all()
        return jsonify([{
            "id": goal.id,
            "title": goal.title,
            "description": goal.description,
            "goal_type": goal.goal_type,
            "target_value": goal.target_value,
            "current_value": goal.current_value,
            "start_date": goal.start_date.isoformat(),
            "end_date": goal.end_date.isoformat(),
            "created_at": goal.created_at.isoformat(),
            "updated_at": goal.updated_at.isoformat(),
            "creator_id": goal.creator_id,
            "user_id": goal.user_id,
            "region": goal.region,
            "shop_id": goal.shop_id,
            "assignee_id": goal.assignee_id,
            "recurring_type": goal.recurring_type,
            "recurring_interval": goal.recurring_interval,
            "parent_goal_id": goal.parent_goal_id,
            "progress": goal.progress,
            "status": goal.status
        } for goal in goals])
    finally:
        session.close()

@app.route('/api/goals/personal/<int:user_id>', methods=['GET'])
@jwt_required()
def get_personal_goals(user_id):
    session = Session()
    try:
        goals = session.query(Goal).filter_by(user_id=user_id).all()
        return jsonify([{
            "id": goal.id,
            "title": goal.title,
            "description": goal.description,
            "goal_type": goal.goal_type,
            "target_value": goal.target_value,
            "current_value": goal.current_value,
            "start_date": goal.start_date.isoformat(),
            "end_date": goal.end_date.isoformat(),
            "created_at": goal.created_at.isoformat(),
            "updated_at": goal.updated_at.isoformat(),
            "creator_id": goal.creator_id,
            "user_id": goal.user_id,
            "region": goal.region,
            "shop_id": goal.shop_id,
            "assignee_id": goal.assignee_id,
            "recurring_type": goal.recurring_type,
            "recurring_interval": goal.recurring_interval,
            "parent_goal_id": goal.parent_goal_id,
            "progress": goal.progress,
            "status": goal.status
        } for goal in goals])
    finally:
        session.close()

@app.route('/api/goals', methods=['POST'])
@jwt_required()
def create_goal():
    data = request.json
    session = Session()
    try:
        goal = Goal(
            title=data.get('title'),
            description=data.get('description'),
            goal_type=data.get('goal_type'),
            target_value=data.get('target_value'),
            current_value=0,
            start_date=datetime.datetime.fromisoformat(data.get('start_date')),
            end_date=datetime.datetime.fromisoformat(data.get('end_date')),
            creator_id=get_jwt_identity(),
            user_id=data.get('user_id'),
            region=data.get('region'),
            shop_id=data.get('shop_id'),
            assignee_id=data.get('assignee_id'),
            recurring_type=data.get('recurring_type', 'none'),
            recurring_interval=data.get('recurring_interval', 0),
            parent_goal_id=data.get('parent_goal_id')
        )
        session.add(goal)
        session.commit()
        
        return jsonify({
            "id": goal.id,
            "title": goal.title,
            "description": goal.description,
            "goal_type": goal.goal_type,
            "target_value": goal.target_value,
            "current_value": goal.current_value,
            "start_date": goal.start_date.isoformat(),
            "end_date": goal.end_date.isoformat(),
            "created_at": goal.created_at.isoformat(),
            "updated_at": goal.updated_at.isoformat(),
            "creator_id": goal.creator_id,
            "user_id": goal.user_id,
            "region": goal.region,
            "shop_id": goal.shop_id,
            "assignee_id": goal.assignee_id,
            "recurring_type": goal.recurring_type,
            "recurring_interval": goal.recurring_interval,
            "parent_goal_id": goal.parent_goal_id,
            "progress": goal.progress,
            "status": goal.status
        })
    finally:
        session.close()

# Brand routes
@app.route('/api/brands', methods=['GET'])
@jwt_required()
def get_brands():
    session = Session()
    try:
        brands = session.query(Brand).all()
        return jsonify([{
            "id": brand.id,
            "name": brand.name,
            "description": brand.description,
            "logo_url": brand.logo_url,
            "created_at": brand.created_at.isoformat(),
            "updated_at": brand.updated_at.isoformat() if brand.updated_at else None,
            "category_count": len(brand.categories)
        } for brand in brands])
    finally:
        session.close()

@app.route('/api/brands', methods=['POST'])
@jwt_required()
def create_brand():
    data = request.json
    session = Session()
    try:
        brand = Brand(
            name=data.get('name'),
            description=data.get('description'),
            logo_url=data.get('logo_url')
        )
        session.add(brand)
        session.commit()
        
        # Create categories if provided
        categories = []
        if data.get('categories'):
            for cat_data in data.get('categories'):
                category = Category(
                    name=cat_data.get('name'),
                    description=cat_data.get('description'),
                    brand_id=brand.id
                )
                session.add(category)
                categories.append(category)
            session.commit()
        
        return jsonify({
            "id": brand.id,
            "name": brand.name,
            "description": brand.description,
            "logo_url": brand.logo_url,
            "created_at": brand.created_at.isoformat(),
            "updated_at": brand.updated_at.isoformat() if brand.updated_at else None,
            "categories": [{
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "brand_id": category.brand_id,
                "created_at": category.created_at.isoformat(),
                "updated_at": category.updated_at.isoformat() if category.updated_at else None
            } for category in categories]
        })
    finally:
        session.close()

@app.route('/api/brands/<int:brand_id>', methods=['GET'])
@jwt_required()
def get_brand(brand_id):
    session = Session()
    try:
        brand = session.query(Brand).filter_by(id=brand_id).first()
        if not brand:
            return jsonify({"error": "Brand not found"}), 404
            
        return jsonify({
            "id": brand.id,
            "name": brand.name,
            "description": brand.description,
            "logo_url": brand.logo_url,
            "created_at": brand.created_at.isoformat(),
            "updated_at": brand.updated_at.isoformat() if brand.updated_at else None,
            "categories": [{
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "product_count": len(category.products)
            } for category in brand.categories]
        })
    finally:
        session.close()

@app.route('/api/brands/<int:brand_id>', methods=['PUT'])
@jwt_required()
def update_brand(brand_id):
    data = request.json
    session = Session()
    try:
        brand = session.query(Brand).filter_by(id=brand_id).first()
        if not brand:
            return jsonify({"error": "Brand not found"}), 404
            
        if 'name' in data:
            brand.name = data['name']
        if 'description' in data:
            brand.description = data['description']
        if 'logo_url' in data:
            brand.logo_url = data['logo_url']
            
        session.commit()
        
        return jsonify({
            "id": brand.id,
            "name": brand.name,
            "description": brand.description,
            "logo_url": brand.logo_url,
            "created_at": brand.created_at.isoformat(),
            "updated_at": brand.updated_at.isoformat() if brand.updated_at else None
        })
    finally:
        session.close()

@app.route('/api/brands/<int:brand_id>', methods=['DELETE'])
@jwt_required()
def delete_brand(brand_id):
    session = Session()
    try:
        brand = session.query(Brand).filter_by(id=brand_id).first()
        if not brand:
            return jsonify({"error": "Brand not found"}), 404
            
        session.delete(brand)
        session.commit()
        
        return jsonify({"message": "Brand deleted successfully"})
    finally:
        session.close()

# Category routes
@app.route('/api/brands/<int:brand_id>/categories', methods=['GET'])
@jwt_required()
def get_brand_categories(brand_id):
    session = Session()
    try:
        categories = session.query(Category).filter_by(brand_id=brand_id).all()
        return jsonify([{
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "brand_id": category.brand_id,
            "created_at": category.created_at.isoformat(),
            "updated_at": category.updated_at.isoformat() if category.updated_at else None,
            "product_count": len(category.products)
        } for category in categories])
    finally:
        session.close()

@app.route('/api/brands/<int:brand_id>/categories', methods=['POST'])
@jwt_required()
def create_category(brand_id):
    data = request.json
    session = Session()
    try:
        brand = session.query(Brand).filter_by(id=brand_id).first()
        if not brand:
            return jsonify({"error": "Brand not found"}), 404
            
        category = Category(
            name=data.get('name'),
            description=data.get('description'),
            brand_id=brand_id
        )
        session.add(category)
        session.commit()
        
        # Create products if provided
        products = []
        if data.get('products'):
            for prod_data in data.get('products'):
                product = Product(
                    name=prod_data.get('name'),
                    description=prod_data.get('description'),
                    price=prod_data.get('price'),
                    sku=prod_data.get('sku'),
                    brand_id=brand_id,
                    category_id=category.id
                )
                session.add(product)
                products.append(product)
            session.commit()
        
        return jsonify({
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "brand_id": category.brand_id,
            "created_at": category.created_at.isoformat(),
            "updated_at": category.updated_at.isoformat() if category.updated_at else None,
            "products": [{
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "sku": product.sku,
                "brand_id": product.brand_id,
                "category_id": product.category_id,
                "created_at": product.created_at.isoformat(),
                "updated_at": product.updated_at.isoformat() if product.updated_at else None
            } for product in products]
        })
    finally:
        session.close()

@app.route('/api/categories/<int:category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    session = Session()
    try:
        category = session.query(Category).filter_by(id=category_id).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404
            
        return jsonify({
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "brand_id": category.brand_id,
            "created_at": category.created_at.isoformat(),
            "updated_at": category.updated_at.isoformat() if category.updated_at else None,
            "products": [{
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "sku": product.sku
            } for product in category.products]
        })
    finally:
        session.close()

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    data = request.json
    session = Session()
    try:
        category = session.query(Category).filter_by(id=category_id).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404
            
        if 'name' in data:
            category.name = data['name']
        if 'description' in data:
            category.description = data['description']
            
        session.commit()
        
        return jsonify({
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "brand_id": category.brand_id,
            "created_at": category.created_at.isoformat(),
            "updated_at": category.updated_at.isoformat() if category.updated_at else None
        })
    finally:
        session.close()

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    session = Session()
    try:
        category = session.query(Category).filter_by(id=category_id).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404
            
        session.delete(category)
        session.commit()
        
        return jsonify({"message": "Category deleted successfully"})
    finally:
        session.close()

@app.route('/api/brands/<int:brand_id>/products', methods=['GET'])
@jwt_required()
def get_brand_products(brand_id):
    session = Session()
    try:
        products = session.query(Product).filter_by(brand_id=brand_id).all()
        return jsonify([{
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "sku": product.sku,
            "brand_id": product.brand_id,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "created_at": product.created_at.isoformat(),
            "updated_at": product.updated_at.isoformat() if product.updated_at else None
        } for product in products])
    finally:
        session.close()

@app.route('/api/categories/<int:category_id>/products', methods=['GET'])
@jwt_required()
def get_category_products(category_id):
    session = Session()
    try:
        products = session.query(Product).filter_by(category_id=category_id).all()
        return jsonify([{
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "sku": product.sku,
            "brand_id": product.brand_id,
            "category_id": product.category_id,
            "created_at": product.created_at.isoformat(),
            "updated_at": product.updated_at.isoformat() if product.updated_at else None
        } for product in products])
    finally:
        session.close()

@app.route('/api/categories/<int:category_id>/products', methods=['POST'])
@jwt_required()
def create_product_in_category(category_id):
    data = request.json
    session = Session()
    try:
        category = session.query(Category).filter_by(id=category_id).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404
            
        product = Product(
            name=data.get('name'),
            description=data.get('description'),
            price=data.get('price'),
            sku=data.get('sku'),
            brand_id=category.brand_id,
            category_id=category_id
        )
        session.add(product)
        session.commit()
        
        return jsonify({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "sku": product.sku,
            "brand_id": product.brand_id,
            "category_id": product.category_id,
            "created_at": product.created_at.isoformat(),
            "updated_at": product.updated_at.isoformat() if product.updated_at else None
        })
    finally:
        session.close()

# Serve uploaded files
@app.route('/api/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok", "timestamp": datetime.datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)