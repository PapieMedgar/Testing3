from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)

# Configure MySQL/MariaDB connection
# Using default localhost credentials
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'password'  # Password set for root user
MYSQL_HOST = 'localhost'
MYSQL_PORT = '3306'
MYSQL_DB = 'salesync'

# Configure the app
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enable CORS
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    "expose_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True,
    "send_wildcard": False
}})

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Define models
class Brand(db.Model):
    __tablename__ = 'brands'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    categories = db.relationship('Category', backref='brand', lazy=True, cascade="all, delete-orphan")

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='category', lazy=True, cascade="all, delete-orphan")

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

# API routes
@app.route('/api/brands', methods=['GET'])
def get_brands():
    brands = Brand.query.all()
    result = []
    for brand in brands:
        # Count categories and products for this brand
        category_count = Category.query.filter_by(brand_id=brand.id).count()
        product_count = Product.query.filter_by(brand_id=brand.id).count()
        
        result.append({
            'id': brand.id,
            'name': brand.name,
            'description': brand.description,
            'created_at': brand.created_at.isoformat(),
            'updated_at': brand.updated_at.isoformat(),
            'category_count': category_count,
            'product_count': product_count
        })
    return jsonify(result)

@app.route('/api/brands/<int:brand_id>', methods=['GET'])
def get_brand(brand_id):
    brand = Brand.query.get_or_404(brand_id)
    # Get categories for this brand
    categories = Category.query.filter_by(brand_id=brand_id).all()
    
    # Format categories
    formatted_categories = []
    for category in categories:
        # Get products for this category
        products = Product.query.filter_by(category_id=category.id).all()
        formatted_products = []
        for product in products:
            formatted_products.append({
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'brand_id': product.brand_id,
                'category_id': product.category_id
            })
        
        formatted_categories.append({
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'brand_id': category.brand_id,
            'products': formatted_products
        })
    
    result = {
        'id': brand.id,
        'name': brand.name,
        'description': brand.description,
        'categories': formatted_categories
    }
    return jsonify(result)

@app.route('/api/brands', methods=['POST'])
def create_brand():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Brand name is required'}), 400
    
    brand = Brand(
        name=data['name'],
        description=data.get('description', '')
    )
    db.session.add(brand)
    db.session.commit()
    
    # Process categories if provided
    if 'categories' in data and isinstance(data['categories'], list):
        for cat_data in data['categories']:
            if 'name' in cat_data:
                category = Category(
                    name=cat_data['name'],
                    description=cat_data.get('description', ''),
                    brand_id=brand.id
                )
                db.session.add(category)
                db.session.commit()
                
                # Process products if provided
                if 'products' in cat_data and isinstance(cat_data['products'], list):
                    for prod_data in cat_data['products']:
                        if 'name' in prod_data:
                            product = Product(
                                name=prod_data['name'],
                                description=prod_data.get('description', ''),
                                brand_id=brand.id,
                                category_id=category.id
                            )
                            db.session.add(product)
                    db.session.commit()
    
    # Return the brand with created_at and updated_at fields
    return jsonify({
        'id': brand.id,
        'name': brand.name,
        'description': brand.description,
        'created_at': brand.created_at.isoformat(),
        'updated_at': brand.updated_at.isoformat()
    }), 201

@app.route('/api/brands/<int:brand_id>', methods=['DELETE'])
def delete_brand(brand_id):
    brand = Brand.query.get_or_404(brand_id)
    db.session.delete(brand)
    db.session.commit()
    return jsonify({'message': 'Brand deleted successfully'}), 200

@app.route('/api/brands/<int:brand_id>/categories', methods=['GET'])
def get_brand_categories(brand_id):
    # Check if brand exists
    brand = Brand.query.get_or_404(brand_id)
    
    # Get categories for this brand
    categories = Category.query.filter_by(brand_id=brand_id).all()
    
    result = []
    for category in categories:
        result.append({
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'brand_id': category.brand_id
        })
    
    return jsonify(result)

@app.route('/api/brands/<int:brand_id>/categories', methods=['POST'])
def create_category(brand_id):
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Category name is required'}), 400
    
    # Check if brand exists
    brand = Brand.query.get_or_404(brand_id)
    
    category = Category(
        name=data['name'],
        description=data.get('description', ''),
        brand_id=brand_id
    )
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'id': category.id,
        'name': category.name,
        'description': category.description,
        'brand_id': category.brand_id
    }), 201

@app.route('/api/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    category = Category.query.get_or_404(category_id)
    
    # Get products for this category
    products = Product.query.filter_by(category_id=category_id).all()
    formatted_products = []
    for product in products:
        formatted_products.append({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'brand_id': product.brand_id,
            'category_id': product.category_id,
            'created_at': product.created_at.isoformat(),
            'updated_at': product.updated_at.isoformat()
        })
    
    return jsonify({
        'id': category.id,
        'name': category.name,
        'description': category.description,
        'brand_id': category.brand_id,
        'created_at': category.created_at.isoformat(),
        'updated_at': category.updated_at.isoformat(),
        'products': formatted_products
    })

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    
    if 'name' in data:
        category.name = data['name']
    if 'description' in data:
        category.description = data['description']
    
    db.session.commit()
    
    # Process products if provided
    if 'products' in data and isinstance(data['products'], list):
        for prod_data in data['products']:
            # Update existing product or create new one
            if 'id' in prod_data and prod_data['id']:
                product = Product.query.get(prod_data['id'])
                if product and product.category_id == category_id:
                    if 'name' in prod_data:
                        product.name = prod_data['name']
                    if 'description' in prod_data:
                        product.description = prod_data['description']
                    db.session.commit()
            else:
                # Create new product
                if 'name' in prod_data:
                    product = Product(
                        name=prod_data['name'],
                        description=prod_data.get('description', ''),
                        brand_id=category.brand_id,
                        category_id=category_id
                    )
                    db.session.add(product)
                    db.session.commit()
    
    return jsonify({
        'id': category.id,
        'name': category.name,
        'description': category.description,
        'brand_id': category.brand_id,
        'created_at': category.created_at.isoformat(),
        'updated_at': category.updated_at.isoformat()
    })

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully'}), 200

@app.route('/api/categories/<int:category_id>/products', methods=['GET'])
def get_category_products(category_id):
    # Check if category exists
    category = Category.query.get_or_404(category_id)
    
    # Get products for this category
    products = Product.query.filter_by(category_id=category_id).all()
    
    result = []
    for product in products:
        result.append({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'brand_id': product.brand_id,
            'category_id': product.category_id,
            'created_at': product.created_at.isoformat(),
            'updated_at': product.updated_at.isoformat()
        })
    
    return jsonify(result)

# Additional route for agents to get products by category
@app.route('/api/agent/categories/<int:category_id>/products', methods=['GET'])
def agent_get_category_products(category_id):
    # Check if category exists
    category = Category.query.get_or_404(category_id)
    
    # Get products for this category
    products = Product.query.filter_by(category_id=category_id).all()
    
    result = []
    for product in products:
        result.append({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'brand_id': product.brand_id,
            'category_id': product.category_id,
            'created_at': product.created_at.isoformat(),
            'updated_at': product.updated_at.isoformat()
        })
    
    return jsonify(result)

@app.route('/api/categories/<int:category_id>/products', methods=['POST'])
def create_product(category_id):
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Product name is required'}), 400
    
    # Get the brand_id from the category
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        brand_id=category.brand_id,
        category_id=category_id
    )
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'brand_id': product.brand_id,
        'category_id': product.category_id
    }), 201

@app.route('/api/brands/<int:brand_id>/products', methods=['GET'])
def get_brand_products(brand_id):
    # Check if brand exists
    brand = Brand.query.get_or_404(brand_id)
    
    # Get all products for this brand
    products = Product.query.filter_by(brand_id=brand_id).all()
    
    result = []
    for product in products:
        result.append({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'brand_id': product.brand_id,
            'category_id': product.category_id
        })
    
    return jsonify(result)

@app.route('/api/brands/<int:brand_id>/products', methods=['POST'])
def create_brand_product(brand_id):
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Product name is required'}), 400
    
    # Check if brand exists
    brand = Brand.query.get_or_404(brand_id)
    
    # Create product
    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        brand_id=brand_id,
        category_id=data.get('category_id')  # Optional category_id
    )
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'brand_id': product.brand_id,
        'category_id': product.category_id
    }), 201

@app.route('/api/brands/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'brand_id': product.brand_id,
        'category_id': product.category_id,
        'created_at': product.created_at.isoformat(),
        'updated_at': product.updated_at.isoformat()
    })

@app.route('/api/brands/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    
    if 'name' in data:
        product.name = data['name']
    if 'description' in data:
        product.description = data['description']
    if 'category_id' in data:
        # Verify the category belongs to the same brand
        if data['category_id']:
            category = Category.query.get(data['category_id'])
            if category and category.brand_id == product.brand_id:
                product.category_id = data['category_id']
    
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'brand_id': product.brand_id,
        'category_id': product.category_id,
        'created_at': product.created_at.isoformat(),
        'updated_at': product.updated_at.isoformat()
    })

@app.route('/api/brands/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'}), 200

@app.route('/api/brands/<int:brand_id>', methods=['PUT'])
def update_brand(brand_id):
    brand = Brand.query.get_or_404(brand_id)
    data = request.get_json()
    
    if 'name' in data:
        brand.name = data['name']
    if 'description' in data:
        brand.description = data['description']
    
    db.session.commit()
    
    # Process categories if provided
    if 'categories' in data and isinstance(data['categories'], list):
        for cat_data in data['categories']:
            # Update existing category or create new one
            if 'id' in cat_data and cat_data['id']:
                category = Category.query.get(cat_data['id'])
                if category and category.brand_id == brand_id:
                    if 'name' in cat_data:
                        category.name = cat_data['name']
                    if 'description' in cat_data:
                        category.description = cat_data['description']
                    db.session.commit()
            else:
                # Create new category
                if 'name' in cat_data:
                    category = Category(
                        name=cat_data['name'],
                        description=cat_data.get('description', ''),
                        brand_id=brand_id
                    )
                    db.session.add(category)
                    db.session.commit()
            
            # Process products if provided
            if 'products' in cat_data and isinstance(cat_data['products'], list):
                category_id = category.id if 'category' in locals() else None
                
                for prod_data in cat_data['products']:
                    # Update existing product or create new one
                    if 'id' in prod_data and prod_data['id']:
                        product = Product.query.get(prod_data['id'])
                        if product and product.brand_id == brand_id:
                            if 'name' in prod_data:
                                product.name = prod_data['name']
                            if 'description' in prod_data:
                                product.description = prod_data['description']
                            db.session.commit()
                    else:
                        # Create new product
                        if 'name' in prod_data and category_id:
                            product = Product(
                                name=prod_data['name'],
                                description=prod_data.get('description', ''),
                                brand_id=brand_id,
                                category_id=category_id
                            )
                            db.session.add(product)
                            db.session.commit()
    
    return jsonify({
        'id': brand.id,
        'name': brand.name,
        'description': brand.description,
        'created_at': brand.created_at.isoformat(),
        'updated_at': brand.updated_at.isoformat()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)