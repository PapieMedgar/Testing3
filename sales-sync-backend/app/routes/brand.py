from flask import Blueprint, request, jsonify
from app import db
from app.models.brand import Brand, Category
from app.models.product import Product
from flask_jwt_extended import jwt_required

brand_bp = Blueprint('brand', __name__)

@brand_bp.route('/brands', methods=['POST'])
@jwt_required()
def create_brand():
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Brand name is required'}), 400
    brand = Brand(name=name)
    db.session.add(brand)
    db.session.commit()
    return jsonify(brand.to_dict()), 201

@brand_bp.route('/brands', methods=['GET'])
@jwt_required()
def get_brands():
    brands = Brand.query.all()
    return jsonify([b.to_dict() for b in brands]), 200

@brand_bp.route('/brands/<int:brand_id>/categories', methods=['POST'])
@jwt_required()
def add_category(brand_id):
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    brand = Brand.query.get_or_404(brand_id)
    category = Category(name=name, brand=brand)
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201

@brand_bp.route('/categories/<int:category_id>/products', methods=['POST'])
@jwt_required()
def add_product(category_id):
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Product name is required'}), 400
    category = Category.query.get_or_404(category_id)
    product = Product(name=name, category=category)
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201

@brand_bp.route('/brands/<int:brand_id>', methods=['GET'])
@jwt_required()
def get_brand(brand_id):
    brand = Brand.query.get_or_404(brand_id)
    return jsonify(brand.to_dict()), 200
