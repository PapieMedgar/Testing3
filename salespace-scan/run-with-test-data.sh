#!/bin/bash
set -e

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
fi

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
  echo "Error: Docker and Docker Compose are required to run this application."
  echo "Please install Docker and Docker Compose first."
  exit 1
fi

# Function to display a spinner while waiting
spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\'
  while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    local spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

echo "🚀 Starting SaleSpace application with test data..."
echo "This will start both frontend and backend services with Docker Compose."

# Build and start the services in development mode
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Wait for the database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Initialize the database with test data
echo "🔄 Initializing database with test data..."
docker-compose exec backend flask init-db --with-test-data &
spinner $!

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
echo "🎉 SaleSpace is ready to use!"