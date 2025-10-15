from run import app
from app import db
import os

with app.app_context():
    # Get the database URL and file path
    db_url = app.config['SQLALCHEMY_DATABASE_URI']
    print(f"Database URL: {db_url}")
    
    # Extract file path
    if db_url.startswith('sqlite:///'):
        db_file = db_url[10:]  # Remove 'sqlite:///'
        if not os.path.isabs(db_file):
            db_file = os.path.join(os.getcwd(), db_file)
        
        print(f"Database file path: {db_file}")
        print(f"File exists: {os.path.exists(db_file)}")
        print(f"File size: {os.path.getsize(db_file) if os.path.exists(db_file) else 'N/A'} bytes")
        
        # Check current working directory
        print(f"Current working directory: {os.getcwd()}")
        
        # List files in current directory
        print("Files in current directory:")
        for file in os.listdir('.'):
            if file.endswith('.db'):
                print(f"  {file} ({os.path.getsize(file)} bytes)")
    
    # Try to inspect table structure from SQLAlchemy perspective
    print("\nSQLAlchemy table info:")
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"Tables found by SQLAlchemy: {tables}")
    
    if 'users' in tables:
        columns = inspector.get_columns('users')
        print("Users table columns:")
        for col in columns:
            print(f"  {col['name']}: {col['type']}")
