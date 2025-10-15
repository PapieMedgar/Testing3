#!/usr/bin/env python3
"""
Database Migration Runner
Run this script to apply database migrations
"""

import os
import sys
import sqlite3
from pathlib import Path

def get_db_connection():
    """Get database connection from environment variables"""
    try:
        # Use the same database file as the Flask app
        db_path = os.getenv('DATABASE_URI', 'sqlite:///salesync.db')
        if db_path.startswith('sqlite:///'):
            db_path = db_path[10:]  # Remove 'sqlite:///'
        
        # Make path absolute if it's relative
        if not os.path.isabs(db_path):
            db_path = os.path.join(os.path.dirname(__file__), db_path)
        
        connection = sqlite3.connect(db_path)
        return connection
    except Exception as e:
        print(f"Error connecting to SQLite database: {e}")
        return None

def run_migration(migration_file):
    """Run a specific migration file"""
    if not os.path.exists(migration_file):
        print(f"Migration file not found: {migration_file}")
        return False
    
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Read migration file
        with open(migration_file, 'r') as file:
            migration_sql = file.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
        
        for statement in statements:
            # Skip comments and empty statements
            if statement.startswith('--') or not statement:
                continue
            
            print(f"Executing: {statement}")
            cursor.execute(statement)
            print(f"Successfully executed: {statement[:50]}...")
        
        connection.commit()
        print(f"Migration completed successfully: {migration_file}")
        return True
        
    except Exception as e:
        print(f"Error executing migration: {e}")
        connection.rollback()
        return False
    
    finally:
        if connection:
            connection.close()

def main():
    """Main migration runner"""
    if len(sys.argv) < 2:
        print("Usage: python migrate.py <migration_file>")
        print("Example: python migrate.py migrations/add_visit_responses_table.sql")
        return
    
    migration_file = sys.argv[1]
    
    print(f"Running migration: {migration_file}")
    success = run_migration(migration_file)
    
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
