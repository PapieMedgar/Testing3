@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting SaleSpace application in PRODUCTION mode...
echo This will build and start all services optimized for production use.

REM Check if .env file exists, if not create it from example
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    
    REM Generate a secure random secret key
    for /f "tokens=*" %%a in ('powershell -Command "[System.Guid]::NewGuid().ToString()"') do set SECRET_KEY=%%a
    
    REM Update the SECRET_KEY in .env file
    powershell -Command "(Get-Content .env) -replace 'your_development_secret_key', '%SECRET_KEY%' | Set-Content .env"
    
    echo Updated SECRET_KEY in .env file with a secure random key.
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

REM Build the production images
echo 🔨 Building production Docker images...
docker-compose build

REM Start the services in production mode
echo 🚀 Starting production services...
docker-compose up -d

REM Wait for the database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 15 /nobreak >nul

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
echo 🎉 SaleSpace PRODUCTION environment is ready to use!

endlocal