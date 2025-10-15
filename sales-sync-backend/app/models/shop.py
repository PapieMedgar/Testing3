from app import db, ma
from sqlalchemy.orm import relationship

class Shop(db.Model):
    __tablename__ = 'shops'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    
    # Relationships - temporarily commented out to resolve circular import issues
    # checkins = relationship('CheckIn', back_populates='shop')
    # managers = relationship('User', secondary='shop_manager_association', back_populates='assigned_shops')

class ShopSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Shop
        load_instance = True

shop_schema = ShopSchema()
shops_schema = ShopSchema(many=True)