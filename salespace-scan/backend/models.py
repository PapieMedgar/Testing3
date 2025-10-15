from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
import datetime
import bcrypt

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    role = Column(String(10), nullable=False)
    name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    manager_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    agents = relationship('User', backref='manager', remote_side=[id])
    visits = relationship('Visit', backref='agent')
    goals_created = relationship('Goal', backref='creator', foreign_keys='Goal.creator_id')
    goals_assigned = relationship('Goal', backref='assignee', foreign_keys='Goal.assignee_id')
    
    def __init__(self, phone, password, role, name=None, is_active=True, manager_id=None):
        self.phone = phone
        self.set_password(password)
        self.role = role
        self.name = name
        self.is_active = is_active
        self.manager_id = manager_id
    
    def set_password(self, password):
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    def check_password(self, password):
        password_bytes = password.encode('utf-8')
        hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)

class Shop(Base):
    __tablename__ = 'shops'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    address = Column(String(200), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    phone = Column(String(20))
    email = Column(String(100))
    owner_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    visits = relationship('Visit', backref='shop')
    goals = relationship('Goal', backref='shop')

class Visit(Base):
    __tablename__ = 'visits'
    
    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey('shops.id'), nullable=False)
    agent_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text)
    status = Column(String(20), default='PENDING')
    photo_path = Column(String(200))
    additional_photos = Column(Text)  # JSON array of photo paths
    brand_id = Column(Integer, ForeignKey('brands.id'))
    
    # Relationships
    brand = relationship('Brand', backref='visits')

class Goal(Base):
    __tablename__ = 'goals'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    goal_type = Column(String(20), nullable=False)
    target_value = Column(Integer, nullable=False)
    current_value = Column(Integer, default=0)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    region = Column(String(100))
    shop_id = Column(Integer, ForeignKey('shops.id'))
    assignee_id = Column(Integer, ForeignKey('users.id'))
    recurring_type = Column(String(20), default='none')
    recurring_interval = Column(Integer, default=0)
    parent_goal_id = Column(Integer, ForeignKey('goals.id'))
    
    # Relationships
    user = relationship('User', foreign_keys=[user_id])
    child_goals = relationship('Goal', backref='parent_goal', remote_side=[id])
    
    @property
    def progress(self):
        if self.target_value == 0:
            return 0
        return (self.current_value / self.target_value) * 100
    
    @property
    def status(self):
        if self.progress >= 100:
            return 'completed'
        if datetime.datetime.now() > self.end_date:
            return 'overdue'
        return 'in_progress'

class Brand(Base):
    __tablename__ = 'brands'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    logo_url = Column(String(200))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    categories = relationship('Category', backref='brand', cascade="all, delete-orphan")
    products = relationship('Product', backref='brand')

class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    brand_id = Column(Integer, ForeignKey('brands.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    products = relationship('Product', backref='category', cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float)
    sku = Column(String(50))
    brand_id = Column(Integer, ForeignKey('brands.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)