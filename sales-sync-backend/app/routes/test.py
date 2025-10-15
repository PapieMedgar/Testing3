from flask import Blueprint, request, jsonify
from app import db
from app.models.brand import Brand, Category
from app.models.product import Product

test_bp = Blueprint('test', __name__)

@test_bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy", "message": "API is running"}), 200

@test_bp.route('/create-category', methods=['POST'])
def create_test_category():
    """Create a test category for a brand"""
    data = request.get_json()
    
    if not data or 'brand_id' not in data or 'name' not in data:
        return jsonify({"error": "Brand ID and category name are required"}), 400
    
    try:
        # Check if brand exists
        brand = Brand.query.get(data['brand_id'])
        if not brand:
            return jsonify({"error": f"Brand with ID {data['brand_id']} not found"}), 404
        
        # Create category
        category = Category(
            name=data['name'],
            description=data.get('description', ''),
            brand_id=data['brand_id']
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            "message": "Category created successfully",
            "category": {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "brand_id": category.brand_id
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create category: {str(e)}"}), 500

@test_bp.route('/create-product', methods=['POST'])
def create_test_product():
    """Create a test product for a brand and category"""
    data = request.get_json()
    
    if not data or 'brand_id' not in data or 'name' not in data:
        return jsonify({"error": "Brand ID and product name are required"}), 400
    
    try:
        # Check if brand exists
        brand = Brand.query.get(data['brand_id'])
        if not brand:
            return jsonify({"error": f"Brand with ID {data['brand_id']} not found"}), 404
        
        # Check if category exists if provided
        category_id = data.get('category_id')
        if category_id:
            category = Category.query.get(category_id)
            if not category:
                return jsonify({"error": f"Category with ID {category_id} not found"}), 404
        
        # Create product
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            brand_id=data['brand_id'],
            category_id=category_id
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            "message": "Product created successfully",
            "product": {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "brand_id": product.brand_id,
                "category_id": product.category_id
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create product: {str(e)}"}), 500