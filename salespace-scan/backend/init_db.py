import os
import sys
import click
import datetime
from flask import Flask
from flask.cli import with_appcontext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Shop, Visit, Goal, Brand, Product

# Create a Flask app for CLI commands
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/salespace')

# Create database engine and session
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
Session = sessionmaker(bind=engine)

@click.command('init-db')
@click.option('--with-test-data', is_flag=True, help='Initialize with test data')
@with_appcontext
def init_db_command(with_test_data):
    """Initialize the database."""
    # Create tables
    Base.metadata.create_all(engine)
    click.echo('Database tables created.')
    
    if with_test_data:
        # Add test data
        add_test_data()
        click.echo('Test data added to database.')

def add_test_data():
    """Add test data to the database."""
    session = Session()
    
    try:
        # Create test users
        admin = User(
            phone='1234567890',
            password='admin123',
            role='ADMIN',
            name='Admin User',
            is_active=True
        )
        
        manager = User(
            phone='2345678901',
            password='manager123',
            role='MANAGER',
            name='Manager User',
            is_active=True
        )
        
        agent1 = User(
            phone='3456789012',
            password='agent123',
            role='AGENT',
            name='Agent One',
            is_active=True,
            manager_id=2  # Will be set after manager is added
        )
        
        agent2 = User(
            phone='4567890123',
            password='agent123',
            role='AGENT',
            name='Agent Two',
            is_active=True,
            manager_id=2  # Will be set after manager is added
        )
        
        session.add_all([admin, manager, agent1, agent2])
        session.commit()
        
        # Update manager_id for agents
        agent1.manager_id = manager.id
        agent2.manager_id = manager.id
        session.commit()
        
        # Create brands
        brand1 = Brand(
            name='TechGadgets',
            description='High-quality tech gadgets and accessories',
            logo_url='techgadgets.png'
        )
        
        brand2 = Brand(
            name='HomeEssentials',
            description='Essential products for your home',
            logo_url='homeessentials.png'
        )
        
        brand3 = Brand(
            name='FreshFoods',
            description='Fresh and healthy food products',
            logo_url='freshfoods.png'
        )
        
        session.add_all([brand1, brand2, brand3])
        session.commit()
        
        # Create products
        products = [
            # TechGadgets products
            Product(
                name='Smartphone Holder',
                description='Adjustable smartphone holder for car',
                price=15.99,
                sku='TG-001',
                brand_id=brand1.id
            ),
            Product(
                name='Wireless Earbuds',
                description='Bluetooth wireless earbuds with charging case',
                price=49.99,
                sku='TG-002',
                brand_id=brand1.id
            ),
            Product(
                name='Power Bank',
                description='10000mAh portable power bank',
                price=29.99,
                sku='TG-003',
                brand_id=brand1.id
            ),
            
            # HomeEssentials products
            Product(
                name='Kitchen Towels',
                description='Set of 4 microfiber kitchen towels',
                price=12.99,
                sku='HE-001',
                brand_id=brand2.id
            ),
            Product(
                name='Bathroom Organizer',
                description='Multi-compartment bathroom organizer',
                price=19.99,
                sku='HE-002',
                brand_id=brand2.id
            ),
            
            # FreshFoods products
            Product(
                name='Organic Cereal',
                description='Organic whole grain cereal',
                price=5.99,
                sku='FF-001',
                brand_id=brand3.id
            ),
            Product(
                name='Protein Bars',
                description='Pack of 6 protein bars',
                price=8.99,
                sku='FF-002',
                brand_id=brand3.id
            )
        ]
        
        session.add_all(products)
        session.commit()
        
        # Create shops
        shops = [
            Shop(
                name='Downtown Market',
                address='123 Main St, Downtown',
                latitude=40.7128,
                longitude=-74.0060,
                phone='5551234567',
                email='info@downtownmarket.com',
                owner_name='John Smith'
            ),
            Shop(
                name='Uptown Grocery',
                address='456 Park Ave, Uptown',
                latitude=40.7831,
                longitude=-73.9712,
                phone='5552345678',
                email='info@uptowngrocery.com',
                owner_name='Jane Doe'
            ),
            Shop(
                name='Westside Shop',
                address='789 West Blvd, Westside',
                latitude=40.7589,
                longitude=-73.9851,
                phone='5553456789',
                email='info@westsideshop.com',
                owner_name='Bob Johnson'
            )
        ]
        
        session.add_all(shops)
        session.commit()
        
        # Create visits
        today = datetime.datetime.now()
        yesterday = today - datetime.timedelta(days=1)
        last_week = today - datetime.timedelta(days=7)
        
        visits = [
            Visit(
                shop_id=shops[0].id,
                agent_id=agent1.id,
                timestamp=today,
                notes='Regular visit, everything in order',
                status='APPROVED',
                photo_path='visit1.jpg',
                brand_id=brand1.id
            ),
            Visit(
                shop_id=shops[1].id,
                agent_id=agent1.id,
                timestamp=yesterday,
                notes='Restocked products, updated displays',
                status='APPROVED',
                photo_path='visit2.jpg',
                brand_id=brand2.id
            ),
            Visit(
                shop_id=shops[2].id,
                agent_id=agent2.id,
                timestamp=last_week,
                notes='Initial visit, set up new display',
                status='PENDING',
                photo_path='visit3.jpg',
                brand_id=brand3.id
            )
        ]
        
        session.add_all(visits)
        session.commit()
        
        # Create goals
        today = datetime.date.today()
        next_month = today.replace(month=today.month+1 if today.month < 12 else 1, year=today.year if today.month < 12 else today.year+1)
        
        goals = [
            Goal(
                title='Monthly Shop Visits',
                description='Complete 20 shop visits this month',
                goal_type='shop_visits',
                target_value=20,
                current_value=3,
                start_date=today,
                end_date=next_month,
                creator_id=admin.id,
                user_id=agent1.id,
                assignee_id=agent1.id,
                recurring_type='monthly',
                recurring_interval=1,
                region=None,
                shop_id=None
            ),
            Goal(
                title='Product Placement',
                description='Set up TechGadgets displays in 10 shops',
                goal_type='individual_visits',
                target_value=10,
                current_value=1,
                start_date=today,
                end_date=next_month,
                creator_id=manager.id,
                user_id=agent2.id,
                assignee_id=agent2.id,
                recurring_type='none',
                recurring_interval=0,
                region=None,
                shop_id=None
            ),
            Goal(
                title='Team Weekly Visits',
                description='Team should complete 30 visits per week',
                goal_type='weekly_visits',
                target_value=30,
                current_value=5,
                start_date=today,
                end_date=today.replace(day=today.day+30),
                creator_id=admin.id,
                user_id=manager.id,
                assignee_id=manager.id,
                recurring_type='weekly',
                recurring_interval=1,
                region=None,
                shop_id=None
            )
        ]
        
        session.add_all(goals)
        session.commit()
        
    except Exception as e:
        session.rollback()
        click.echo(f'Error adding test data: {str(e)}')
        raise
    finally:
        session.close()

# Register the command with Flask
app.cli.add_command(init_db_command)

if __name__ == '__main__':
    app.cli.main()