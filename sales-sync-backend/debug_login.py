from run import app
from app import bcrypt, db
from app.models.user import User

with app.app_context():
    print("=== DEBUG LOGIN PROCESS ===")
    
    # Test the exact same logic as the login route
    phone = '1234567892'
    password = 'agent123'
    
    print(f"Looking for user with phone: {phone}")
    user = User.query.filter_by(phone=phone).first()
    
    if user:
        print(f"Found user: {user.name}")
        print(f"User is active: {user.is_active}")
        print(f"Password hash: {user.password_hash[:50]}...")
        
        # Test password verification
        password_valid = bcrypt.check_password_hash(user.password_hash, password)
        print(f"Password verification result: {password_valid}")
        
        # Check all conditions like in the login route
        all_conditions = user and user.is_active and password_valid
        print(f"All login conditions met: {all_conditions}")
        
    else:
        print("User not found!")
        
        # Show all users
        all_users = User.query.all()
        print(f"\nAll users in database ({len(all_users)}):")
        for u in all_users:
            print(f"  - {u.phone} ({u.name})")
