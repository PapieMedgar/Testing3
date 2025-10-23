#!/usr/bin/env python3
"""
Database initialization script for SaleSync
Creates all tables and adds sample data
"""

from app import create_app, db, bcrypt
from app.models.user import User, UserRole
from app.models.shop import Shop
from app.models.checkin import CheckIn, CheckInStatus
from datetime import datetime
import os

def init_database():
    """Initialize the database with tables and sample data"""
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        
        # Create all tables
        db.create_all()
        print("✓ Database tables created successfully")
        
        # Check if data already exists
        if User.query.first():
            print("Database already has data. Skipping sample data creation.")
            return
            
        print("Adding sample data...")
        
        # Create sample users with phone number authentication
        # Generate a proper hash for 'admin123'
        admin_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
        
        users = [
            User(
                phone_number='27738643876',  # Admin phone number
                password=admin_password,
                role=UserRole.ADMIN,
                name='System Administrator',
                is_active=True
            ),
            User(
                phone_number='27738643877',  # Manager phone  
                password=bcrypt.generate_password_hash('mgr123').decode('utf-8'),
                role=UserRole.MANAGER,
                name='John Manager',
                is_active=True,
                created_by=1  # Created by admin
            ),
            User(
                phone_number='27738643878',  # Agent phone
                password=bcrypt.generate_password_hash('ag1123').decode('utf-8'),
                role=UserRole.AGENT,
                name='Sarah Agent',
                is_active=True,
                created_by=1,  # Created by admin
                manager_id=2   # Managed by John Manager
            ),
            User(
                phone_number='27738643879',  # Agent phone
                password=bcrypt.generate_password_hash('ag2123').decode('utf-8'),
                role=UserRole.AGENT,
                name='Mike Agent',
                is_active=True,
                created_by=1,  # Created by admin
                manager_id=2   # Managed by John Manager
            )
        ]
        
        for user in users:
            db.session.add(user)
        
        # Create sample shops
        shops = [
            Shop(
                name='Sandton City Mall - MTN Store',
                address='Sandton City Shopping Centre, Johannesburg',
                latitude=-26.1076,
                longitude=28.0567
            ),
            Shop(
                name='Canal Walk MTN Store',
                address='Canal Walk Shopping Centre, Cape Town',
                latitude=-33.8969,
                longitude=18.5119
            ),
            Shop(
                name='Gateway MTN Store',
                address='Gateway Theatre of Shopping, Durban',
                latitude=-29.7309,
                longitude=31.0725
            ),
            Shop(
                name='Menlyn Park MTN Store',
                address='Menlyn Park Shopping Centre, Pretoria',
                latitude=-25.7851,
                longitude=28.2773
            ),
            Shop(
                name='V&A Waterfront MTN Store',
                address='V&A Waterfront, Cape Town',
                latitude=-33.9039,
                longitude=18.4196
            )
        ]
        
        for shop in shops:
            db.session.add(shop)
        
        # Commit users and shops first
        db.session.commit()
        print("✓ Sample users and shops created")
        
        # Create sample check-ins (after users and shops are committed)
        checkins = [
            CheckIn(
                agent_id=3,  # agent1
                shop_id=1,   # Sandton City Mall
                timestamp=datetime.now(),
                latitude=-26.1076,
                longitude=28.0567,
                notes='Store visit completed successfully',
                status=CheckInStatus.APPROVED
            ),
            CheckIn(
                agent_id=4,  # agent2
                shop_id=2,   # Canal Walk
                timestamp=datetime.now(),
                latitude=-33.8969,
                longitude=18.5119,
                notes='Meeting with store manager',
                status=CheckInStatus.PENDING
            )
        ]
        
        for checkin in checkins:
            db.session.add(checkin)
        
        db.session.commit()
        print("✓ Sample check-ins created")
        print("\n🎉 Database initialization completed successfully!")
        print("\nSample login credentials (phone number / password):")
        print("  Admin: 27738643876 / admin123")
        print("  Manager: 27738643877 / mgr123") 
        print("  Agent: 27738643878 / ag1123")
        print("  Agent: 27738643879 / ag2123")

if __name__ == '__main__':
    init_database()
