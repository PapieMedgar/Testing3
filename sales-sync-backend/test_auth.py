from run import app
from app import bcrypt, db
from app.models.user import User

with app.app_context():
    # Check if SQLAlchemy can see any users at all
    all_users = User.query.all()
    print(f"Total users found by SQLAlchemy: {len(all_users)}")
    
    for user in all_users:
        print(f"User: {user.phone} ({user.name}) - Role: {user.role}")
    
    # Try direct database query with newer SQLAlchemy syntax
    with db.engine.connect() as conn:
        result = conn.execute(db.text("SELECT phone, name, role FROM users"))
        print("\nDirect SQL query results:")
        for row in result:
            print(f"Phone: {row[0]}, Name: {row[1]}, Role: {row[2]}")
    
    # Test authentication for specific user
    user = User.query.filter_by(phone='1234567892').first()
    
    if user:
        print(f"\nFound user: {user.name} ({user.phone})")
        print(f"User is active: {user.is_active}")
        print(f"Password hash: {user.password_hash[:50]}...")
        
        # Test password verification
        password_correct = bcrypt.check_password_hash(user.password_hash, 'agent123')
        print(f"Password 'agent123' is correct: {password_correct}")
    else:
        print("\nSpecific user not found!")
