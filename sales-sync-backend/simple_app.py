from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////workspace/sales-sync-backend/test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)

db = SQLAlchemy(app)

# Define models
class Brand(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    categories = db.relationship('Category', backref='brand', lazy=True, cascade='all, delete-orphan')

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    brand_id = db.Column(db.Integer, db.ForeignKey('brand.id'), nullable=False)
    products = db.relationship('Product', backref='category', lazy=True, cascade='all, delete-orphan')

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    brand_id = db.Column(db.Integer, db.ForeignKey('brand.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)

# Create tables
with app.app_context():
    db.create_all()

# API routes
@app.route('/api/brands', methods=['GET'])
def get_brands():
    brands = Brand.query.all()
    result = []
    for brand in brands:
        result.append({
            'id': brand.id,
            'name': brand.name,
            'description': brand.description
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
    
    brand = Brand(name=data['name'], description=data.get('description', ''))
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
                db.session.flush()
                
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
    
    return jsonify({
        'id': brand.id,
        'name': brand.name,
        'description': brand.description
    }), 201

@app.route('/api/brands/<int:brand_id>/categories', methods=['GET'])
def get_brand_categories(brand_id):
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
    
    category = Category(
        name=data['name'],
        description=data.get('description', ''),
        brand_id=brand_id
    )
    db.session.add(category)
    db.session.commit()
    
    # Process products if provided
    if 'products' in data and isinstance(data['products'], list):
        for prod_data in data['products']:
            if 'name' in prod_data:
                product = Product(
                    name=prod_data['name'],
                    description=prod_data.get('description', ''),
                    brand_id=brand_id,
                    category_id=category.id
                )
                db.session.add(product)
        db.session.commit()
    
    return jsonify({
        'id': category.id,
        'name': category.name,
        'description': category.description,
        'brand_id': category.brand_id
    }), 201

@app.route('/api/categories/<int:category_id>/products', methods=['GET'])
def get_category_products(category_id):
    products = Product.query.filter_by(category_id=category_id).all()
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)