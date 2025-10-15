from app import db
from datetime import datetime
from enum import Enum

class GoalType(Enum):
    MANAGER_COUNT = "managers"
    AGENT_COUNT = "agents"
    INDIVIDUAL_VISITS = "individual_visits"
    SHOP_VISITS = "shop_visits"

class Goal(db.Model):
    __tablename__ = 'goals'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    goal_type = db.Column(db.String(50), nullable=False)
    target_value = db.Column(db.Integer, nullable=False)
    current_value = db.Column(db.Integer, default=0)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Additional fields for specific goal types
    region = db.Column(db.String(100))  # For regional goals
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'))  # For shop-specific goals
    
    # User assigned to this goal
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'goal_type': self.goal_type,
            'target_value': self.target_value,
            'current_value': self.current_value,
            'progress': round((self.current_value / self.target_value) * 100 if self.target_value > 0 else 0, 2),
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'creator_id': self.creator_id,
            'region': self.region,
            'shop_id': self.shop_id,
            'user_id': self.user_id
        }
