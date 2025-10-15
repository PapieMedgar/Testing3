from app import db, ma
from sqlalchemy import Enum, Text
from sqlalchemy.orm import relationship
import enum
import json

class VisitType(enum.Enum):
    INDIVIDUAL = 'individual'
    CUSTOMER = 'customer'

class VisitResponse(db.Model):
    __tablename__ = 'visit_responses'
    
    id = db.Column(db.Integer, primary_key=True)
    checkin_id = db.Column(db.Integer, db.ForeignKey('checkins.id'), nullable=False)
    visit_type = db.Column(Enum(VisitType), nullable=False)
    responses = db.Column(Text, nullable=False)  # Store JSON as TEXT for SQLite compatibility
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    checkin = relationship('CheckIn', backref='visit_responses')
    
    def set_responses(self, data):
        """Set responses as JSON string"""
        self.responses = json.dumps(data)
    
    def get_responses(self):
        """Get responses as Python dict"""
        return json.loads(self.responses) if self.responses else {}

class VisitResponseSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = VisitResponse
        load_instance = True
        include_fk = True
    
    # Convert enum to string value
    visit_type = ma.Method("get_visit_type_value")
    responses = ma.Method("get_responses_value")
    
    def get_visit_type_value(self, obj):
        return obj.visit_type.value if obj.visit_type else None
    
    def get_responses_value(self, obj):
        return obj.get_responses()

visit_response_schema = VisitResponseSchema()
visit_responses_schema = VisitResponseSchema(many=True)
