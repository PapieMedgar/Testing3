import os
import mysql.connector
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

def run_migration():
    """Run the migration to add description column to brands table"""
    try:
        # Parse DATABASE_URI
        database_uri = os.getenv('DATABASE_URI', 'mysql://salesuser:salespassword@localhost:3307/salesync')
        
        # Remove query parameters
        if '?' in database_uri:
            database_uri = database_uri.split('?')[0]
            
        match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', database_uri)

        if match:
            user, password, host, port, database = match.groups()
        else:
            # Default values if parsing fails
            user = 'salesuser'
            password = 'salespassword'
            host = 'localhost'
            port = '3307'
            database = 'salesync'

        # Database connection parameters
        db_config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database,
            'port': int(port)
        }
        
        print(f"Connecting to {host}:{port} as {user}")
        
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Execute the SQL migration
        sql = "ALTER TABLE brands ADD COLUMN IF NOT EXISTS description TEXT;"
        cursor.execute(sql)

        # Commit the changes
        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Error running migration: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    run_migration()