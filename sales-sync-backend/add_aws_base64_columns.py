#!/usr/bin/env python3
"""
Add base64 columns to AWS MySQL database
"""
import pymysql

def add_base64_columns():
    """Add photo_base64 and additional_photos_base64 columns to AWS database"""
    try:
        print("🔄 Adding base64 columns to AWS MySQL...")
        
        connection = pymysql.connect(
            host='13.244.241.5',
            port=3306,
            user='dev',
            password='Developer1234#',
            database='salessync',
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # Check if columns exist
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'salessync' 
                AND TABLE_NAME = 'checkins'
            """)
            
            existing_columns = [row[0] for row in cursor.fetchall()]
            print(f"📋 Existing columns: {', '.join(existing_columns)}")
            
            # Add photo_base64 column if it doesn't exist
            if 'photo_base64' not in existing_columns:
                print("➕ Adding photo_base64 column...")
                cursor.execute("""
                    ALTER TABLE checkins 
                    ADD COLUMN photo_base64 LONGTEXT;
                """)
            else:
                print("✅ photo_base64 column already exists")
            
            # Add additional_photos_base64 column if it doesn't exist
            if 'additional_photos_base64' not in existing_columns:
                print("➕ Adding additional_photos_base64 column...")
                cursor.execute("""
                    ALTER TABLE checkins 
                    ADD COLUMN additional_photos_base64 LONGTEXT;
                """)
            else:
                print("✅ additional_photos_base64 column already exists")
            
            connection.commit()
            
            # Verify the new columns
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'salessync' 
                AND TABLE_NAME = 'checkins' 
                AND COLUMN_NAME LIKE '%photo%'
            """)
            
            print("\n✅ Photo-related columns in AWS database:")
            for row in cursor.fetchall():
                print(f"  {row[0]}: {row[1]} (max_length: {row[2]})")
        
        connection.close()
        print("\n🎉 AWS base64 columns setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ AWS column setup failed: {e}")
        return False

if __name__ == "__main__":
    add_base64_columns()
