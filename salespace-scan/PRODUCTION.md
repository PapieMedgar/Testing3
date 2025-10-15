# SaleSpace Production Deployment Guide

This guide explains how to deploy the SaleSpace application in production mode.

## Prerequisites

- Docker and Docker Compose installed on your server
- Git installed to clone the repository
- A server with at least 2GB RAM and 1 CPU core
- Open ports: 3000 (frontend) and 5000 (backend API)

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/SupportGonxt/salespace-scan.git
cd salespace-scan
```

### 2. Configure Environment Variables

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

Edit the `.env` file to set production values:

```
# Frontend Environment Variables
VITE_API_BASE_URL=http://your-server-ip:5000/api
VITE_ENV=production

# Backend Environment Variables
FLASK_APP=app.py
FLASK_ENV=production
DATABASE_URL=postgresql://postgres:your-secure-password@db:5432/salespace
SECRET_KEY=your-secure-secret-key
CORS_ORIGINS=http://your-server-ip:3000

# Database Environment Variables
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=salespace
```

Replace:
- `your-server-ip` with your actual server IP or domain name
- `your-secure-password` with a strong database password
- `your-secure-secret-key` with a random secure key

### 3. Run the Production Setup Script

We've provided a script to automate the production deployment:

```bash
chmod +x run-production.sh
./run-production.sh
```

This script will:
- Create a `.env` file if it doesn't exist
- Generate a secure random secret key
- Build the production Docker images
- Start all services in production mode
- Initialize the database with test data

### 4. Manual Deployment (Alternative)

If you prefer to run the commands manually:

```bash
# Build the production images
docker-compose build

# Start the services
docker-compose up -d

# Initialize the database with test data
docker-compose exec backend flask init-db --with-test-data
```

## Production Configuration Details

### Frontend (Nginx + React)

The production frontend:
- Uses Nginx to serve static files
- Is optimized with minified bundles
- Has environment variables baked in at build time

### Backend (Gunicorn + Flask)

The production backend:
- Uses Gunicorn as a production WSGI server
- Has debug mode disabled
- Uses connection pooling for database access
- Has proper error handling

### Database (PostgreSQL)

The database:
- Uses persistent volume storage
- Has proper password authentication
- Maintains data between container restarts

## Monitoring and Maintenance

### Viewing Logs

```bash
# View frontend logs
docker-compose logs -f frontend

# View backend logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f db
```

### Backing Up the Database

```bash
# Create a database backup
docker-compose exec db pg_dump -U postgres salespace > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T db psql -U postgres -d salespace
```

### Updating the Application

```bash
# Pull the latest changes
git pull

# Rebuild and restart the services
docker-compose down
docker-compose build
docker-compose up -d
```

## Security Considerations

For a production environment, consider:

1. Using HTTPS with proper SSL certificates
2. Setting up a reverse proxy (like Nginx) in front of the application
3. Implementing proper firewall rules
4. Using Docker secrets for sensitive information
5. Setting up regular database backups
6. Implementing monitoring and alerting

## Troubleshooting

If you encounter issues:

1. Check the logs for each service
2. Verify the environment variables are set correctly
3. Ensure all ports are accessible
4. Check that the database is running properly

For persistent issues, refer to the GitHub repository issues section.