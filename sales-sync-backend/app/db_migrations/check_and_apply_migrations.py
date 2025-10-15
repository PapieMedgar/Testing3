import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from app import create_app, db
from sqlalchemy import text, inspect

def check_and_apply_migrations():
    """Check if migrations need to be applied and apply them if necessary"""
    app = create_app()
    with app.app_context():
        inspector = inspect(db.engine)
        
        # Check if brands table exists
        if 'brands' in inspector.get_table_names():
            # Check if description column exists in brands table
            columns = [column['name'] for column in inspector.get_columns('brands')]
            if 'description' not in columns:
                print("Adding description column to brands table...")
                db.session.execute(text("ALTER TABLE brands ADD COLUMN description TEXT;"))
                db.session.commit()
                print("Migration completed successfully!")
            else:
                print("Description column already exists in brands table.")
        else:
            print("Brands table does not exist. No migration needed.")

if __name__ == "__main__":
    check_and_apply_migrations()