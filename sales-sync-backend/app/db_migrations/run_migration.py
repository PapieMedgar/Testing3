import os
import mysql.connector
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Parse DATABASE_URI
database_uri = os.getenv('DATABASE_URI', 'mysql://root:password@localhost:3306/salesync')
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', database_uri)

if match:
    user, password, host, port, database = match.groups()
else:
    # Default values if parsing fails
    user = 'root'
    password = 'password'
    host = 'localhost'
    port = '3306'
    database = 'salesync'

# Database connection parameters
db_config = {
    'host': host,
    'user': user,
    'password': password,
    'database': database,
    'port': int(port)
}

def run_migration():
    """Run the migration to add description column to brands table"""
    try:
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Read and execute the SQL migration
        with open('app/db_migrations/add_description_to_brands.sql', 'r') as f:
            sql = f.read()
            
        # Split the SQL into statements
        statements = sql.split(';')
        
        for statement in statements:
            if statement.strip():
                cursor.execute(statement)
                
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