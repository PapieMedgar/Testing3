from app import create_app, db
from sqlalchemy import text, inspect

app = create_app()

@app.cli.command("create-db")
def create_db():
    """Create database tables."""
    db.create_all()
    print("Database tables created!")

@app.cli.command("drop-db")
def drop_db():
    """Drop all database tables."""
    db.drop_all()
    print("Database tables dropped!")

@app.cli.command("check-migrations")
def check_migrations():
    """Check if migrations need to be applied and apply them if necessary"""
    with app.app_context():
        try:
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
        except Exception as e:
            print(f"Error checking migrations: {e}")

def check_and_apply_migrations():
    """Check if migrations need to be applied and apply them if necessary"""
    with app.app_context():
        try:
            inspector = inspect(db.engine)
            
            # Create all tables if they don't exist
            print("Creating database tables if they don't exist...")
            db.create_all()
            print("Database tables created or already exist!")
            
            # Check if brands table exists
            if 'brands' in inspector.get_table_names():
                # Check if description column exists in brands table
                brand_columns = [column['name'] for column in inspector.get_columns('brands')]
                if 'description' not in brand_columns:
                    print("Adding description column to brands table...")
                    db.session.execute(text("ALTER TABLE brands ADD COLUMN description TEXT;"))
                    db.session.commit()
                    print("Brand description migration completed successfully!")
                else:
                    print("Description column already exists in brands table.")
            else:
                print("Brands table will be created.")
                
            # Check if products table exists
            if 'products' in inspector.get_table_names():
                # Check if description column exists in products table
                product_columns = [column['name'] for column in inspector.get_columns('products')]
                
                # Add description column if it doesn't exist
                if 'description' not in product_columns:
                    print("Adding description column to products table...")
                    db.session.execute(text("ALTER TABLE products ADD COLUMN description TEXT;"))
                    db.session.commit()
                    print("Product description migration completed successfully!")
                else:
                    print("Description column already exists in products table.")
                    
                # Add image_path column if it doesn't exist
                if 'image_path' not in product_columns:
                    print("Adding image_path column to products table...")
                    db.session.execute(text("ALTER TABLE products ADD COLUMN image_path VARCHAR(255);"))
                    db.session.commit()
                    print("Product image_path migration completed successfully!")
                else:
                    print("image_path column already exists in products table.")
                    
                # Add brand_id column if it doesn't exist
                if 'brand_id' not in product_columns:
                    print("Adding brand_id column to products table...")
                    db.session.execute(text("ALTER TABLE products ADD COLUMN brand_id INT;"))
                    db.session.execute(text("ALTER TABLE products ADD CONSTRAINT fk_product_brand FOREIGN KEY (brand_id) REFERENCES brands(id);"))
                    db.session.commit()
                    print("Product brand_id migration completed successfully!")
                else:
                    print("brand_id column already exists in products table.")
                    
                # Add category_id column if it doesn't exist
                if 'category_id' not in product_columns:
                    print("Adding category_id column to products table...")
                    db.session.execute(text("ALTER TABLE products ADD COLUMN category_id INT;"))
                    db.session.execute(text("ALTER TABLE products ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id);"))
                    db.session.commit()
                    print("Product category_id migration completed successfully!")
                else:
                    print("category_id column already exists in products table.")
                    
                # Add created_at column if it doesn't exist
                if 'created_at' not in product_columns:
                    print("Adding created_at column to products table...")
                    db.session.execute(text("ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
                    db.session.commit()
                    print("Product created_at migration completed successfully!")
                else:
                    print("created_at column already exists in products table.")
                    
                # Add updated_at column if it doesn't exist
                if 'updated_at' not in product_columns:
                    print("Adding updated_at column to products table...")
                    db.session.execute(text("ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"))
                    db.session.commit()
                    print("Product updated_at migration completed successfully!")
                else:
                    print("updated_at column already exists in products table.")
            else:
                print("Products table does not exist. No migration needed.")
                
            # Check if categories table exists
            if 'categories' in inspector.get_table_names():
                # Check if description column exists in categories table
                category_columns = [column['name'] for column in inspector.get_columns('categories')]
                
                # Add description column if it doesn't exist
                if 'description' not in category_columns:
                    print("Adding description column to categories table...")
                    db.session.execute(text("ALTER TABLE categories ADD COLUMN description TEXT;"))
                    db.session.commit()
                    print("Category description migration completed successfully!")
                else:
                    print("Description column already exists in categories table.")
                    
                # Add created_at column if it doesn't exist
                if 'created_at' not in category_columns:
                    print("Adding created_at column to categories table...")
                    db.session.execute(text("ALTER TABLE categories ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
                    db.session.commit()
                    print("Category created_at migration completed successfully!")
                else:
                    print("created_at column already exists in categories table.")
                    
                # Add updated_at column if it doesn't exist
                if 'updated_at' not in category_columns:
                    print("Adding updated_at column to categories table...")
                    db.session.execute(text("ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"))
                    db.session.commit()
                    print("Category updated_at migration completed successfully!")
                else:
                    print("updated_at column already exists in categories table.")
            else:
                print("Categories table does not exist. No migration needed.")
                
            # Check if brands table needs additional columns
            if 'brands' in inspector.get_table_names():
                brand_columns = [column['name'] for column in inspector.get_columns('brands')]
                
                # Add logo_path column if it doesn't exist
                if 'logo_path' not in brand_columns:
                    print("Adding logo_path column to brands table...")
                    db.session.execute(text("ALTER TABLE brands ADD COLUMN logo_path VARCHAR(255);"))
                    db.session.commit()
                    print("Brand logo_path migration completed successfully!")
                else:
                    print("logo_path column already exists in brands table.")
                    
                # Add created_at column if it doesn't exist
                if 'created_at' not in brand_columns:
                    print("Adding created_at column to brands table...")
                    db.session.execute(text("ALTER TABLE brands ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
                    db.session.commit()
                    print("Brand created_at migration completed successfully!")
                else:
                    print("created_at column already exists in brands table.")
                    
                # Add updated_at column if it doesn't exist
                if 'updated_at' not in brand_columns:
                    print("Adding updated_at column to brands table...")
                    db.session.execute(text("ALTER TABLE brands ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"))
                    db.session.commit()
                    print("Brand updated_at migration completed successfully!")
                else:
                    print("updated_at column already exists in brands table.")
            
            print("All migrations completed successfully!")
        except Exception as e:
            print(f"Error checking migrations: {e}")

if __name__ == '__main__':
    try:
        # Check and apply migrations before starting the app
        check_and_apply_migrations()
    except Exception as e:
        print(f"Error during migration check: {e}")
        print("Continuing with app startup...")

    # Create the uploads directory if it doesn't exist
    import os
    uploads_dir = app.config.get('UPLOAD_FOLDER', './uploads')
    print(f"DEBUG: uploads_dir is set to: {uploads_dir}")
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(os.path.join(uploads_dir, 'logos'), exist_ok=True)


    # --- Log database connection info and check connectivity ---
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    from urllib.parse import urlparse
    parsed = urlparse(db_uri.replace('mysql+pymysql://', 'mysql://'))
    db_host = parsed.hostname
    db_name = parsed.path.lstrip('/')
    print(f'Connecting to database: host={db_host}, database={db_name}')

    # Check DB connectivity
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                conn.execute(text('SELECT 1'))
            print('Database connection successful.')
        except Exception as e:
            print(f'FATAL: Could not connect to the database! Error: {e}')
            import sys
            sys.exit(1)

    # --- Create default admin account if not exists ---
    from app.models.user import User, UserRole
    from app import bcrypt, db
    with app.app_context():
        admin_phone = 'admin'
        admin_password = 'admin1234'  # Change this for production!
        admin = User.query.filter_by(phone=admin_phone, role=UserRole.ADMIN).first()
        password_hash = bcrypt.generate_password_hash(admin_password).decode('utf-8')
        if not admin:
            print('No admin account found. Creating default admin account...')
            admin = User(phone=admin_phone, password_hash=password_hash, admin_viewable_password=admin_password, role=UserRole.ADMIN, name='Admin User', is_active=True)
            db.session.add(admin)
            db.session.commit()
            print(f'Admin account created. Phone: {admin_phone}, Password: {admin_password}')
        else:
            print('Admin account already exists. Updating password and details...')
            admin.password_hash = password_hash
            admin.admin_viewable_password = admin_password
            admin.name = 'Admin User'
            admin.is_active = True
            db.session.commit()
            print(f'Admin account updated. Phone: {admin_phone}, Password: {admin_password}')

    # Start the app
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=True)