#!/usr/bin/env python3
"""
Run base64 migration on AWS MySQL database
"""
import pymysql

def run_aws_migration():
    """Run LONGTEXT migration on AWS database"""
    try:
        print("🔄 Running base64 columns migration on AWS MySQL...")
        
        connection = pymysql.connect(
            host='13.244.241.5',
            port=3306,
            user='dev',
            password='Developer1234#',
            database='salessync',
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # Check current column types
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'salessync' 
                AND TABLE_NAME = 'checkins' 
                AND COLUMN_NAME IN ('photo_base64', 'additional_photos_base64')
            """)
            
            print("\n📋 Current AWS column information:")
            for row in cursor.fetchall():
                print(f"  {row[0]}: {row[1]} (max_length: {row[2]})")
            
            # Upgrade to LONGTEXT
            print("\n🔧 Upgrading photo_base64 column to LONGTEXT...")
            cursor.execute("""
                ALTER TABLE checkins 
                MODIFY COLUMN photo_base64 LONGTEXT;
            """)
            
            print("🔧 Upgrading additional_photos_base64 column to LONGTEXT...")
            cursor.execute("""
                ALTER TABLE checkins 
                MODIFY COLUMN additional_photos_base64 LONGTEXT;
            """)
            
            connection.commit()
            
            # Verify the changes
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'salessync' 
                AND TABLE_NAME = 'checkins' 
                AND COLUMN_NAME IN ('photo_base64', 'additional_photos_base64')
            """)
            
            print("\n✅ Updated AWS column information:")
            for row in cursor.fetchall():
                print(f"  {row[0]}: {row[1]} (max_length: {row[2]})")
        
        connection.close()
        print("\n🎉 AWS database migration completed successfully!")
        print("📝 Base64 image columns can now store up to 4GB of data each")
        return True
        
    except Exception as e:
        print(f"❌ AWS migration failed: {e}")
        return False

if __name__ == "__main__":
    run_aws_migration()
