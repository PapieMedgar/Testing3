from app import db, ma
from sqlalchemy.orm import relationship
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True, default='')
    image_path = db.Column(db.String(255))
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    brand = relationship('Brand', backref=db.backref('products', lazy=True, cascade='all, delete-orphan'))
    # Category relationship is defined in the Category model with backref
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description or '',
            'image_path': self.image_path or '',
            'brand_id': self.brand_id,
            'category_id': self.category_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'brand_name': self.brand.name if self.brand else None,
            'category_name': self.category.name if self.category else None
        }

class ProductSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Product
        load_instance = True
        include_fk = True
        include_relationships = True

product_schema = ProductSchema()
products_schema = ProductSchema(many=True)