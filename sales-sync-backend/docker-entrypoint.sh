#!/bin/bash

# Wait for MySQL to be ready
while ! nc -z mysql 3306; do
    echo "Waiting for MySQL to be ready..."
    sleep 2
done

# Run database migrations
echo "Running database migrations..."
mysql -h mysql -u salesuser -psalespassword salesync < /app/migrations/add_columns_to_products.sql
mysql -h mysql -u salesuser -psalespassword salesync < /app/migrations/add_photo_base64_columns.sql
echo "Database migrations completed!"

# Create initial admin user
echo "Setting up initial admin user..."
python -c "
from app import create_app, db, bcrypt
from app.models.user import User, UserRole

app = create_app()
with app.app_context():
    db.create_all()
    admin_user = User.query.filter_by(role=UserRole.ADMIN).first()
    if not admin_user:
        admin_user = User(
            phone='+27123456789',
            password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
            role=UserRole.ADMIN
        )
        db.session.add(admin_user)
        db.session.commit()
        print('Admin user created successfully! Phone: +27123456789, Password: admin123')
    else:
        print('Admin user already exists')
"

# Run automatic migrations check
echo "Running automatic migrations check..."
python -c "
from app import create_app
from run import check_and_apply_migrations

app = create_app()
check_and_apply_migrations()
"

# Start the Flask application
if [ "$FLASK_ENV" = "development" ]; then
    echo "Starting Flask in development mode with hot reload..."
    exec python run.py
else
    exec gunicorn --bind 0.0.0.0:5000 run:app
fi