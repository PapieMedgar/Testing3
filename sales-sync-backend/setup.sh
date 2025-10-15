#!/bin/bash

# Create a virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Create uploads directory
mkdir -p uploads

# Set up MySQL database
echo "Please ensure MySQL is installed and running."
echo "Create a database and user with the following commands:"
echo "CREATE DATABASE salesync;"
echo "CREATE USER 'salesuser'@'localhost' IDENTIFIED BY 'salespassword';"
echo "GRANT ALL PRIVILEGES ON salesync.* TO 'salesuser'@'localhost';"
echo "FLUSH PRIVILEGES;"

# Create database tables
flask create-db

# Create initial admin user
echo "Creating initial admin user..."
flask shell -c "
from app import create_app, db, bcrypt
from app.models.user import User, UserRole

app = create_app()
with app.app_context():
    admin_user = User(
        username='admin',
        email='admin@salesync.com',
        password=bcrypt.generate_password_hash('adminpassword').decode('utf-8'),
        role=UserRole.ADMIN
    )
    db.session.add(admin_user)
    db.session.commit()
    print('Admin user created successfully!')
"

echo "Setup complete! Run the application with 'flask run' or 'python run.py'"