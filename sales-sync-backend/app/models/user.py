from app import db, ma
from sqlalchemy.orm import relationship
from sqlalchemy import Enum, Table, Column, Integer, ForeignKey
import enum

# Association tables
manager_agent_association = Table('manager_agent_association', db.metadata,
    Column('manager_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('agent_id', Integer, ForeignKey('users.id'), primary_key=True)
)

shop_manager_association = Table('shop_manager_association', db.metadata,
    Column('shop_id', Integer, ForeignKey('shops.id'), primary_key=True),
    Column('manager_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class UserRole(enum.Enum):
    ADMIN = 'admin'
    MANAGER = 'manager'
    AGENT = 'agent'

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(15), unique=True, nullable=False)  # Login ID
    password_hash = db.Column(db.String(255), nullable=False)  # Generated password
    admin_viewable_password = db.Column(db.String(255), nullable=True)  # For admin access
    role = db.Column(Enum(UserRole), nullable=False)
    name = db.Column(db.String(100), nullable=True)  # Optional full name
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Admin who created this user
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # For agents only
    
    # Relationships
    # Users created by this admin
    created_users = relationship('User', backref='creator', remote_side=[id], foreign_keys=[created_by])
    # Agents managed by this manager
    managed_agents = relationship('User', backref='manager', remote_side=[id], foreign_keys=[manager_id])
    # Temporarily commented out to resolve circular import issues
    # checkins = relationship('CheckIn', back_populates='agent', lazy='dynamic')

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ('password_hash',)
        include_fk = True  # Include foreign keys like manager_id
    
    # Convert enum to string value
    role = ma.Method("get_role_value")
    
    def get_role_value(self, obj):
        return obj.role.name if obj.role else None

user_schema = UserSchema()
users_schema = UserSchema(many=True)