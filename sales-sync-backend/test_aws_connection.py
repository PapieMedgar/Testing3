#!/usr/bin/env python3
"""
Simple AWS MySQL connection test
"""
import pymysql

def test_aws_connection():
    """Test direct connection to AWS MySQL"""
    try:
        print("🔗 Testing AWS MySQL connection...")
        print("   Host: 13.244.241.5:3306")
        print("   Database: salessync")
        print("   User: dev")
        
        connection = pymysql.connect(
            host='13.244.241.5',
            port=3306,
            user='dev',
            password='Developer1234#',
            database='salessync',
            charset='utf8mb4'
        )
        
        print("✅ AWS MySQL connection successful!")
        
        # Test basic query
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"📊 MySQL Version: {version[0]}")
            
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"📋 Tables in AWS database: {len(tables)}")
            if tables:
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print("   No tables found - database is empty")
        
        connection.close()
        print("✅ AWS MySQL test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ AWS MySQL connection failed: {e}")
        return False

if __name__ == "__main__":
    test_aws_connection()
