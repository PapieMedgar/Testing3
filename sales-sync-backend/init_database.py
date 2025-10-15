from run import app
from app import db

with app.app_context():
    print("Creating database tables...")
    
    try:
        # Import all models to ensure they are registered
        from app.models.user import User, UserRole
        from app.models.shop import Shop
        from app.models.checkin import CheckIn, CheckInStatus
        from app.models.visit_response import VisitResponse, VisitType
        
        print("All models imported successfully")
        
        # Force SQLAlchemy to reflect current state
        db.drop_all()
        print("Dropped existing tables")
        
        # Create all tables
        db.create_all()
        print("Created all tables")
        
        # Verify tables were created
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"Tables created: {tables}")
        
        # Create some sample data using SQLAlchemy
        from app import bcrypt
        
        # Create admin
        admin = User(
            phone='1234567890',
            password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
            role=UserRole.ADMIN,
            name='Admin User',
            is_active=True
        )
        
        # Create manager
        manager = User(
            phone='1234567891',
            password_hash=bcrypt.generate_password_hash('manager123').decode('utf-8'),
            role=UserRole.MANAGER,
            name='Test Manager',
            is_active=True
        )
        
        # Create agent
        agent = User(
            phone='1234567892',
            password_hash=bcrypt.generate_password_hash('agent123').decode('utf-8'),
            role=UserRole.AGENT,
            name='Test Agent',
            is_active=True,
            manager_id=None  # Will be set after manager is saved
        )
        
        # Add users to session
        db.session.add(admin)
        db.session.add(manager)
        db.session.add(agent)
        db.session.commit()
        
        # Update agent with manager reference
        agent.manager_id = manager.id
        
        # Create sample shops
        shops_data = [
            Shop(name='Super Store', address='123 Main St, Johannesburg', latitude=-26.2041, longitude=28.0473),
            Shop(name='Corner Shop', address='456 Side Ave, Pretoria', latitude=-25.7461, longitude=28.1881),
            Shop(name='Mini Market', address='789 High St, Durban', latitude=-29.8587, longitude=31.0218),
        ]
        
        for shop in shops_data:
            db.session.add(shop)
        
        db.session.commit()
        
        print("Sample data created successfully!")
        
        # Verify data
        user_count = User.query.count()
        shop_count = Shop.query.count()
        print(f"Created {user_count} users and {shop_count} shops")

    except Exception as e:
        print(f"Error during database initialization: {e}")
        import traceback
        traceback.print_exc()
