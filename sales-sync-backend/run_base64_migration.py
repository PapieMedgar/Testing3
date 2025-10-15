#!/usr/bin/env python3
"""
Run the base64 columns size fix migration
"""
import os
import sys

# Add the parent directory to the path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import text

def main():
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Running base64 columns size migration...")
            
            # Check current column type
            with db.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'checkins' 
                    AND COLUMN_NAME IN ('photo_base64', 'additional_photos_base64')
                """))
                
                print("\n📋 Current column information:")
                for row in result:
                    print(f"  {row[0]}: {row[1]} (max_length: {row[2]})")
                
                # Upgrade to LONGTEXT
                print("\n🔧 Upgrading photo_base64 column to LONGTEXT...")
                conn.execute(text("""
                    ALTER TABLE checkins 
                    MODIFY COLUMN photo_base64 LONGTEXT;
                """))
                
                print("🔧 Upgrading additional_photos_base64 column to LONGTEXT...")
                conn.execute(text("""
                    ALTER TABLE checkins 
                    MODIFY COLUMN additional_photos_base64 LONGTEXT;
                """))
                
                conn.commit()
                
                # Verify the changes
                result = conn.execute(text("""
                    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'checkins' 
                    AND COLUMN_NAME IN ('photo_base64', 'additional_photos_base64')
                """))
            
                print("\n✅ Updated column information:")
                for row in result:
                    print(f"  {row[0]}: {row[1]} (max_length: {row[2]})")
                
                print("\n🎉 Migration completed successfully!")
                print("📝 Base64 image columns can now store up to 4GB of data each")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
