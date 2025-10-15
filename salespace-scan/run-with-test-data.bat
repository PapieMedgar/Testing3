@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting SaleSpace application with test data...
echo This will start both frontend and backend services with Docker Compose.

REM Check if .env file exists, if not create it from example
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
)

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is not installed or not in your PATH.
    echo Please install Docker Desktop for Windows first.
    exit /b 1
)

REM Check if Docker Compose is installed
where docker-compose >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Docker Compose is not installed or not in your PATH.
    echo Please install Docker Desktop for Windows which includes Docker Compose.
    exit /b 1
)

REM Build and start the services in development mode
echo 🔨 Building and starting services...
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

REM Wait for the database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Initialize the database with test data
echo 🔄 Initializing database with test data...
docker-compose exec backend flask init-db --with-test-data

echo ✅ Database initialized with test data!
echo.
echo 🌐 Frontend is running at: http://localhost:3000
echo 🔌 Backend API is running at: http://localhost:5000/api
echo.
echo 📝 Test user credentials:
echo    Admin: Phone: 1234567890, Password: admin123
echo    Manager: Phone: 2345678901, Password: manager123
echo    Agent: Phone: 3456789012, Password: agent123
echo.
echo 📊 To view logs:
echo    Frontend: docker-compose logs -f frontend
echo    Backend: docker-compose logs -f backend
echo.
echo 🛑 To stop all services:
echo    docker-compose down
echo.
echo 🎉 SaleSpace is ready to use!

endlocal