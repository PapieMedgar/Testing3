#!/usr/bin/env python3
"""
Test MySQL database connection
"""
import os
import sys
from dotenv import load_dotenv
import pymysql

# Load environment variables
load_dotenv()

def test_connection():
    """Test direct MySQL connection"""
    try:
        # Parse DATABASE_URI
        db_uri = os.getenv('DATABASE_URI')
        print(f"📊 Testing connection with: {db_uri}")
        
        # Extract connection details
        # Format: mysql+pymysql://salesuser:salespassword@localhost:3307/salesync
        if 'mysql+pymysql://' in db_uri:
            # Remove mysql+pymysql:// prefix
            conn_str = db_uri.replace('mysql+pymysql://', '')
            
            # Extract user:password@host:port/database
            if '@' in conn_str:
                auth_part, host_db_part = conn_str.split('@', 1)
                username, password = auth_part.split(':', 1)
                
                if '/' in host_db_part:
                    host_port, database = host_db_part.split('/', 1)
                    if ':' in host_port:
                        host, port = host_port.split(':', 1)
                        port = int(port)
                    else:
                        host = host_port
                        port = 3306
                else:
                    host_port = host_db_part
                    database = 'salesync'
                    if ':' in host_port:
                        host, port = host_port.split(':', 1)
                        port = int(port)
                    else:
                        host = host_port
                        port = 3306
            else:
                raise ValueError("Invalid DATABASE_URI format")
        else:
            raise ValueError("DATABASE_URI must start with mysql+pymysql://")
        
        print(f"🔗 Connecting to: {host}:{port}")
        print(f"👤 Username: {username}")
        print(f"🗄️  Database: {database}")
        
        # Test connection
        connection = pymysql.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database,
            charset='utf8mb4'
        )
        
        print("✅ Connection successful!")
        
        # Test basic query
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"📊 MySQL Version: {version[0]}")
            
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"📋 Tables in database: {len(tables)}")
            for table in tables:
                print(f"   - {table[0]}")
        
        connection.close()
        print("✅ Database connection test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_flask_app():
    """Test Flask app database connection"""
    try:
        # Add the parent directory to the path so we can import app
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        from app import create_app, db
        
        print("\n🔄 Testing Flask app database connection...")
        
        app = create_app()
        with app.app_context():
            # Test SQLAlchemy connection
            result = db.engine.execute(db.text("SELECT 1"))
            print("✅ Flask SQLAlchemy connection successful!")
            
            # Check if tables exist
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"📋 SQLAlchemy found {len(tables)} tables:")
            for table in tables:
                print(f"   - {table}")
            
        return True
        
    except Exception as e:
        print(f"❌ Flask app database connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 MySQL Database Connection Test")
    print("=" * 50)
    
    # Test 1: Direct PyMySQL connection
    print("\n1️⃣ Testing direct PyMySQL connection...")
    direct_success = test_connection()
    
    # Test 2: Flask app connection
    print("\n2️⃣ Testing Flask app connection...")
    flask_success = test_flask_app()
    
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"   Direct MySQL: {'✅ PASS' if direct_success else '❌ FAIL'}")
    print(f"   Flask SQLAlchemy: {'✅ PASS' if flask_success else '❌ FAIL'}")
    
    if direct_success and flask_success:
        print("\n🎉 All tests passed! Your MySQL database is properly configured.")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")
