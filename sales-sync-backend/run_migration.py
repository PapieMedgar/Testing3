import os
from app import create_app, db
from migrations.add_base64_image_columns import run_migration

# Override the database URI to use SQLite
os.environ['DATABASE_URI'] = 'sqlite:////workspace/sales-sync-backend/test.db'

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        # Create all tables if they don't exist
        db.create_all()
        # Run the migration
        run_migration()