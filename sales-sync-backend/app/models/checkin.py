from app import db, ma
from sqlalchemy.orm import relationship
from sqlalchemy import Enum, Text
from sqlalchemy.dialects.mysql import LONGTEXT
import enum
from marshmallow import fields, post_dump

class CheckInStatus(enum.Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    FLAGGED = 'flagged'

class CheckIn(db.Model):
    __tablename__ = 'checkins'
    
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=True)  # Made nullable for individual visits

    # New fields for drilldown
    brand_id = db.Column(db.Integer, nullable=True)
    category_id = db.Column(db.Integer, nullable=True)
    product_id = db.Column(db.Integer, nullable=True)

    timestamp = db.Column(db.DateTime, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    # Original file path field (kept for backward compatibility)
    photo_path = db.Column(db.String(255), nullable=True)
    
    # New base64 image fields - use LONGTEXT for large base64 data
    photo_base64 = db.Column(LONGTEXT, nullable=True)  # Main photo as base64
    additional_photos_base64 = db.Column(LONGTEXT, nullable=True)  # JSON array of additional base64 photos
    
    notes = db.Column(db.Text)

    status = db.Column(Enum(CheckInStatus), default=CheckInStatus.PENDING)
    # Relationships - temporarily commented out to resolve circular import issues
    # agent = relationship('User', back_populates='checkins')
    # shop = relationship('Shop', back_populates='checkins')

class CheckInSchema(ma.SQLAlchemyAutoSchema):
    # Explicitly define status field as string
    status = fields.Method("get_status_string")
    
    brand_id = fields.Integer()
    category_id = fields.Integer()
    product_id = fields.Integer()
    
    # Include base64 image fields
    photo_base64 = fields.String()
    additional_photos_base64 = fields.String()

    class Meta:
        model = CheckIn
        load_instance = True
        include_fk = True
    
    def get_status_string(self, obj):
        """Convert CheckInStatus enum to string"""
        return obj.status.value if obj.status else None

checkin_schema = CheckInSchema()
checkins_schema = CheckInSchema(many=True)