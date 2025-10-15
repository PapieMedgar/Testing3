from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.brand import Brand, Category
from app.models.product import Product, product_schema, products_schema
from marshmallow import Schema, fields
from functools import wraps
import os
import uuid
from werkzeug.utils import secure_filename

# Define schemas for serialization
class CategorySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    brand_id = fields.Int(required=True)
    products = fields.List(fields.Nested(lambda: ProductSchema()))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class BrandSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    logo_path = fields.Str()
    categories = fields.List(fields.Nested(CategorySchema))
    product_count = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class ProductSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    image_path = fields.Str()
    brand_id = fields.Int(required=True)
    category_id = fields.Int()
    brand_name = fields.Str(dump_only=True)
    category_name = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

# Initialize schemas
brand_schema = BrandSchema()
brands_schema = BrandSchema(many=True)
category_schema = CategorySchema()
categories_schema = CategorySchema(many=True)

brands_bp = Blueprint('brands', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != UserRole.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Brand Management Routes
@brands_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_all_brands():
    """Get all brands"""
    brands = Brand.query.all()
    return jsonify(brands_schema.dump(brands)), 200

@brands_bp.route('/<int:brand_id>', methods=['GET'])
@jwt_required()
def get_brand(brand_id):
    """Get a specific brand by ID"""
    brand = Brand.query.get_or_404(brand_id)
    return jsonify(brand_schema.dump(brand)), 200

@brands_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
@admin_required
def create_brand():
    """Create a new brand with optional categories and products"""
    data = request.get_json()
    current_app.logger.info(f"Creating brand with data: {data}")
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Brand name is required'}), 400
    
    # Check if brand with this name already exists
    existing_brand = Brand.query.filter_by(name=data['name']).first()
    if existing_brand:
        return jsonify({'error': 'A brand with this name already exists'}), 409
    
    try:
        # Create the brand
        brand = Brand(
            name=data['name'],
            description=data.get('description', '')
        )
        
        db.session.add(brand)
        db.session.flush()  # Get the brand ID without committing
        
        # Process categories if provided
        if 'categories' in data and isinstance(data['categories'], list):
            for cat_data in data['categories']:
                if 'name' in cat_data:
                    # Create category
                    category = Category(
                        name=cat_data['name'],
                        description=cat_data.get('description', ''),
                        brand_id=brand.id
                    )
                    db.session.add(category)
                    db.session.flush()  # Get the category ID without committing
                    
                    # Process products if provided
                    if 'products' in cat_data and isinstance(cat_data['products'], list):
                        for prod_data in cat_data['products']:
                            if 'name' in prod_data:
                                # Create product
                                product = Product(
                                    name=prod_data['name'],
                                    description=prod_data.get('description', ''),
                                    brand_id=brand.id,
                                    category_id=category.id
                                )
                                db.session.add(product)
        
        db.session.commit()
        
        # Reload the brand with all relationships
        brand = Brand.query.get(brand.id)
        return jsonify(brand_schema.dump(brand)), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating brand: {str(e)}")
        return jsonify({'error': f'Failed to create brand: {str(e)}'}), 500

@brands_bp.route('/<int:brand_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_brand(brand_id):
    """Update an existing brand with optional categories and products"""
    brand = Brand.query.get_or_404(brand_id)
    data = request.get_json()
    current_app.logger.info(f"Updating brand {brand_id} with data: {data}")
    
    if not data:
        return jsonify({'error': 'No update data provided'}), 400
    
    try:
        # Update brand basic info
        if 'name' in data:
            # Check if another brand with this name exists
            existing_brand = Brand.query.filter(Brand.name == data['name'], Brand.id != brand_id).first()
            if existing_brand:
                return jsonify({'error': 'Another brand with this name already exists'}), 409
            brand.name = data['name']
            
        if 'description' in data:
            brand.description = data['description']
        
        # Process categories if provided
        if 'categories' in data and isinstance(data['categories'], list):
            # Get existing categories for this brand
            existing_categories = Category.query.filter_by(brand_id=brand_id).all()
            existing_category_ids = [cat.id for cat in existing_categories]
            
            # Track processed categories to determine which ones to delete
            processed_category_ids = []
            
            for cat_data in data['categories']:
                if 'name' in cat_data:
                    category = None
                    
                    # Check if this is an existing category or a new one
                    if 'id' in cat_data and cat_data['id'] > 0:
                        # Existing category - update it
                        category = Category.query.get(cat_data['id'])
                        if category and category.brand_id == brand_id:
                            category.name = cat_data['name']
                            category.description = cat_data.get('description', '')
                            processed_category_ids.append(category.id)
                        else:
                            # Category not found or belongs to another brand
                            continue
                    else:
                        # New category - create it
                        category = Category(
                            name=cat_data['name'],
                            description=cat_data.get('description', ''),
                            brand_id=brand_id
                        )
                        db.session.add(category)
                        db.session.flush()  # Get the category ID
                        processed_category_ids.append(category.id)
                    
                    # Process products if provided
                    if 'products' in cat_data and isinstance(cat_data['products'], list):
                        # Get existing products for this category
                        existing_products = Product.query.filter_by(category_id=category.id).all()
                        existing_product_ids = [prod.id for prod in existing_products]
                        
                        # Track processed products to determine which ones to delete
                        processed_product_ids = []
                        
                        for prod_data in cat_data['products']:
                            if 'name' in prod_data:
                                product = None
                                
                                # Check if this is an existing product or a new one
                                if 'id' in prod_data and prod_data['id'] > 0:
                                    # Existing product - update it
                                    product = Product.query.get(prod_data['id'])
                                    if product and product.category_id == category.id:
                                        product.name = prod_data['name']
                                        product.description = prod_data.get('description', '')
                                        processed_product_ids.append(product.id)
                                    else:
                                        # Product not found or belongs to another category
                                        continue
                                else:
                                    # New product - create it
                                    product = Product(
                                        name=prod_data['name'],
                                        description=prod_data.get('description', ''),
                                        brand_id=brand_id,
                                        category_id=category.id
                                    )
                                    db.session.add(product)
                                    db.session.flush()  # Get the product ID
                                    processed_product_ids.append(product.id)
                        
                        # Delete products that were not in the update data
                        for product_id in existing_product_ids:
                            if product_id not in processed_product_ids:
                                product_to_delete = Product.query.get(product_id)
                                if product_to_delete:
                                    db.session.delete(product_to_delete)
            
            # Delete categories that were not in the update data
            for category_id in existing_category_ids:
                if category_id not in processed_category_ids:
                    category_to_delete = Category.query.get(category_id)
                    if category_to_delete:
                        db.session.delete(category_to_delete)
        
        db.session.commit()
        
        # Reload the brand with all relationships
        brand = Brand.query.get(brand_id)
        return jsonify(brand_schema.dump(brand)), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating brand: {str(e)}")
        return jsonify({'error': f'Failed to update brand: {str(e)}'}), 500

@brands_bp.route('/<int:brand_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_brand(brand_id):
    """Delete a brand"""
    brand = Brand.query.get_or_404(brand_id)
    
    try:
        db.session.delete(brand)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting brand: {str(e)}")
        return jsonify({'error': 'Failed to delete brand'}), 500

# Brand Logo Upload
@brands_bp.route('/<int:brand_id>/logo', methods=['POST'])
@jwt_required()
@admin_required
def upload_brand_logo(brand_id):
    """Upload a logo for a brand"""
    brand = Brand.query.get_or_404(brand_id)
    
    if 'logo' not in request.files:
        return jsonify({'error': 'No logo file provided'}), 400
        
    logo_file = request.files['logo']
    
    if logo_file.filename == '':
        return jsonify({'error': 'No logo file selected'}), 400
        
    if logo_file:
        # Generate a secure filename with UUID to avoid collisions
        filename = f"{uuid.uuid4()}_{secure_filename(logo_file.filename)}"
        logo_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'logos', filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(logo_path), exist_ok=True)
        
        # Save the file
        logo_file.save(logo_path)
        
        # Update brand with logo path
        brand.logo_path = f"logos/{filename}"
        db.session.commit()
        
        return jsonify({
            'message': 'Logo uploaded successfully',
            'logo_path': brand.logo_path
        }), 200
    
    return jsonify({'error': 'Failed to upload logo'}), 400

# Product Management Routes
@brands_bp.route('/<int:brand_id>/products', methods=['GET'])
@jwt_required()
def get_brand_products(brand_id):
    """Get all products for a specific brand"""
    Brand.query.get_or_404(brand_id)  # Verify brand exists
    products = Product.query.filter_by(brand_id=brand_id).all()
    return jsonify(products_schema.dump(products)), 200

@brands_bp.route('/<int:brand_id>/products', methods=['POST'])
@jwt_required()
@admin_required
def create_product(brand_id):
    """Create a new product for a brand"""
    brand = Brand.query.get_or_404(brand_id)
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Product name is required'}), 400
    
    try:
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            brand_id=brand_id
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify(product_schema.dump(product)), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating product: {str(e)}")
        return jsonify({'error': 'Failed to create product'}), 500

@brands_bp.route('/products/<int:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """Get a specific product by ID"""
    product = Product.query.get_or_404(product_id)
    return jsonify(product_schema.dump(product)), 200

@brands_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_product(product_id):
    """Update an existing product"""
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No update data provided'}), 400
    
    try:
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'brand_id' in data:
            # Verify brand exists
            Brand.query.get_or_404(data['brand_id'])
            product.brand_id = data['brand_id']
            
        db.session.commit()
        return jsonify(product_schema.dump(product)), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating product: {str(e)}")
        return jsonify({'error': 'Failed to update product'}), 500

@brands_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_product(product_id):
    """Delete a product"""
    product = Product.query.get_or_404(product_id)
    
    try:
        db.session.delete(product)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting product: {str(e)}")
        return jsonify({'error': 'Failed to delete product'}), 500

# Product Image Upload
@brands_bp.route('/products/<int:product_id>/image', methods=['POST'])
@jwt_required()
@admin_required
def upload_product_image(product_id):
    """Upload an image for a product"""
    product = Product.query.get_or_404(product_id)
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
        
    image_file = request.files['image']
    
    if image_file.filename == '':
        return jsonify({'error': 'No image file selected'}), 400
        
    if image_file:
        # Generate a secure filename with UUID to avoid collisions
        filename = f"{uuid.uuid4()}_{secure_filename(image_file.filename)}"
        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'products', filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        
        # Save the file
        image_file.save(image_path)
        
        # Update product with image path
        product.image_path = f"products/{filename}"
        db.session.commit()
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'image_path': product.image_path
        }), 200
    
    return jsonify({'error': 'Failed to upload image'}), 400

# Category Management Routes
@brands_bp.route('/<int:brand_id>/categories', methods=['GET'])
@jwt_required()
def get_brand_categories(brand_id):
    """Get all categories for a specific brand"""
    Brand.query.get_or_404(brand_id)  # Verify brand exists
    categories = Category.query.filter_by(brand_id=brand_id).all()
    return jsonify(categories_schema.dump(categories)), 200

@brands_bp.route('/<int:brand_id>/categories', methods=['POST'])
@jwt_required()
@admin_required
def create_category(brand_id):
    """Create a new category for a brand"""
    brand = Brand.query.get_or_404(brand_id)
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Category name is required'}), 400
    
    try:
        category = Category(
            name=data['name'],
            description=data.get('description', ''),
            brand_id=brand_id
        )
        
        db.session.add(category)
        db.session.commit()
        
        # If products are included in the request, create them
        if 'products' in data and isinstance(data['products'], list):
            for product_data in data['products']:
                if 'name' in product_data:
                    product = Product(
                        name=product_data['name'],
                        description=product_data.get('description', ''),
                        brand_id=brand_id,
                        category_id=category.id
                    )
                    db.session.add(product)
            
            db.session.commit()
        
        return jsonify(category_schema.dump(category)), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating category: {str(e)}")
        return jsonify({'error': 'Failed to create category'}), 500

@brands_bp.route('/categories/<int:category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    """Get a specific category by ID"""
    category = Category.query.get_or_404(category_id)
    return jsonify(category_schema.dump(category)), 200

@brands_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_category(category_id):
    """Update an existing category"""
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No update data provided'}), 400
    
    try:
        if 'name' in data:
            category.name = data['name']
        if 'description' in data:
            category.description = data['description']
            
        db.session.commit()
        return jsonify(category_schema.dump(category)), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating category: {str(e)}")
        return jsonify({'error': 'Failed to update category'}), 500

@brands_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_category(category_id):
    """Delete a category"""
    category = Category.query.get_or_404(category_id)
    
    try:
        db.session.delete(category)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting category: {str(e)}")
        return jsonify({'error': 'Failed to delete category'}), 500

@brands_bp.route('/categories/<int:category_id>/products', methods=['GET'])
@jwt_required()
def get_category_products(category_id):
    """Get all products for a specific category"""
    Category.query.get_or_404(category_id)  # Verify category exists
    products = Product.query.filter_by(category_id=category_id).all()
    return jsonify(products_schema.dump(products)), 200

@brands_bp.route('/categories/<int:category_id>/products', methods=['POST'])
@jwt_required()
@admin_required
def create_product_in_category(category_id):
    """Create a new product in a category"""
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Product name is required'}), 400
    
    try:
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            brand_id=category.brand_id,
            category_id=category_id
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify(product_schema.dump(product)), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating product in category: {str(e)}")
        return jsonify({'error': 'Failed to create product'}), 500