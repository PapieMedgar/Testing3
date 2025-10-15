#!/usr/bin/env python3
"""
Setup script to create the initial admin user for Sales Sync
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash

def create_admin_user():
    app = create_app()
    
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        
        # Check if admin already exists
        admin_phone = "+27123456789"  # Change this to your desired admin phone
        admin_password = "admin123"   # Change this to your desired password
        
        existing_admin = User.query.filter_by(phone=admin_phone).first()
        if existing_admin:
            print(f"Admin user with phone {admin_phone} already exists!")
            print(f"Role: {existing_admin.role.value}")
            return
        
        # Create the admin user
        admin_user = User(
            phone=admin_phone,
            password_hash=generate_password_hash(admin_password),
            role=UserRole.ADMIN
        )
        
        try:
            db.session.add(admin_user)
            db.session.commit()
            
            print("✅ Admin user created successfully!")
            print(f"📱 Phone: {admin_phone}")
            print(f"🔑 Password: {admin_password}")
            print(f"👑 Role: {admin_user.role.value}")
            print("\n🚀 You can now login with these credentials!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating admin user: {str(e)}")

if __name__ == "__main__":
    create_admin_user()
