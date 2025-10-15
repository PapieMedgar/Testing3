#!/bin/bash
set -e

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  
  # Generate a secure random secret key
  SECRET_KEY=$(openssl rand -hex 32)
  
  # Update the SECRET_KEY in .env file
  sed -i "s/your_development_secret_key/$SECRET_KEY/g" .env
  
  echo "Updated SECRET_KEY in .env file with a secure random key."
fi

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
  echo "Error: Docker and Docker Compose are required to run this application."
  echo "Please install Docker and Docker Compose first."
  exit 1
fi

echo "🚀 Starting SaleSpace application in PRODUCTION mode..."
echo "This will build and start all services optimized for production use."

# Build and start the services in production mode
echo "🔨 Building production Docker images..."
docker-compose build

echo "🚀 Starting production services..."
docker-compose up -d

# Wait for the database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Initialize the database with test data
echo "🔄 Initializing database with test data..."
docker-compose exec backend flask init-db --with-test-data

echo "✅ Database initialized with test data!"
echo ""
echo "🌐 Frontend is running at: http://localhost:3000"
echo "🔌 Backend API is running at: http://localhost:5000/api"
echo ""
echo "📝 Test user credentials:"
echo "   Admin: Phone: 1234567890, Password: admin123"
echo "   Manager: Phone: 2345678901, Password: manager123"
echo "   Agent: Phone: 3456789012, Password: agent123"
echo ""
echo "📊 To view logs:"
echo "   Frontend: docker-compose logs -f frontend"
echo "   Backend: docker-compose logs -f backend"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
echo ""
echo "🎉 SaleSpace PRODUCTION environment is ready to use!"