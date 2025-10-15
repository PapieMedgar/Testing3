# Sales Sync Backend

## Prerequisites
- Docker
- Docker Compose

## Setup and Running

### Development Setup
1. Clone the repository
2. Navigate to the project directory
3. Create a `.env` file (optional, defaults are set in docker-compose)

### Running with Docker
```bash
# Build and start the services
docker-compose up --build

# Stop the services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

### Initial Setup
- Default Admin Credentials:
  - Username: `admin`
  - Password: `adminpassword`

## API Endpoints
- Authentication: `/api/auth/`
- Admin Routes: `/api/admin/`
- Manager Routes: `/api/manager/`
- Agent Routes: `/api/agent/`

## Environment Variables
- `DATABASE_URI`: MySQL database connection string
- `SECRET_KEY`: Flask secret key
- `JWT_SECRET_KEY`: JWT token secret key
- `UPLOAD_FOLDER`: Path for storing uploaded files

## Development Notes
- Always use Docker for consistent environment
- Modify `.env` file for custom configurations
- Use `docker-compose exec` to run management commands