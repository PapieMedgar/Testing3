from app import create_app, db
from app.models.brand import Brand, Category
from app.models.product import Product

def apply_migration():
    app = create_app()
    with app.app_context():
        db.create_all()
        print("Brands, categories, and products tables created!")

if __name__ == '__main__':
    apply_migration()
