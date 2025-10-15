# SaleSpace Windows Setup Guide

This guide explains how to run the SaleSpace application on Windows systems.

## Prerequisites

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) installed and running
- Git for Windows installed
- PowerShell 5.0 or later

## Setup Instructions

### 1. Clone the Repository

Open PowerShell or Command Prompt and run:

```
git clone https://github.com/SupportGonxt/salespace-scan.git
cd salespace-scan
```

### 2. Development Environment

To run the application in development mode with test data:

1. Double-click the `run-with-test-data.bat` file in File Explorer
   
   OR
   
   Run the following in PowerShell or Command Prompt:
   ```
   .\run-with-test-data.bat
   ```

This script will:
- Create a `.env` file if it doesn't exist
- Start the services in development mode
- Initialize the database with test data

### 3. Production Environment

To run the application in production mode:

1. Double-click the `run-production.bat` file in File Explorer
   
   OR
   
   Run the following in PowerShell or Command Prompt:
   ```
   .\run-production.bat
   ```

This script will:
- Create a `.env` file if it doesn't exist
- Generate a secure random secret key
- Build optimized production Docker images
- Start all services in production mode
- Initialize the database with test data

## Accessing the Application

After running either script, you can access the application at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Test User Credentials

- **Admin**: Phone: 1234567890, Password: admin123
- **Manager**: Phone: 2345678901, Password: manager123
- **Agent**: Phone: 3456789012, Password: agent123

## Common Windows-Specific Issues

### Docker Desktop Not Running

If you see an error like "Cannot connect to the Docker daemon", make sure Docker Desktop is running. Look for the Docker icon in your system tray.

### Port Conflicts

If ports 3000 or 5000 are already in use on your system:

1. Edit the `docker-compose.yml` file
2. Change the port mappings (e.g., from "3000:3000" to "3001:3000")
3. Save the file and run the script again

### Windows Path Issues

If you encounter path-related issues:

1. Make sure you're using the correct path format for Windows
2. Try using PowerShell instead of Command Prompt
3. Ensure Docker Desktop has access to the drive where your project is located

### WSL2 Backend for Docker

Docker Desktop for Windows uses WSL2 (Windows Subsystem for Linux) by default. If you encounter issues:

1. Open Docker Desktop settings
2. Go to "Resources" > "WSL Integration"
3. Make sure WSL2 integration is enabled
4. Restart Docker Desktop

## Stopping the Application

To stop all services:

```
docker-compose down
```

To stop and remove all data (including the database):

```
docker-compose down -v
```

## Viewing Logs

To view logs for a specific service:

```
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

## Troubleshooting

If you encounter issues:

1. Make sure Docker Desktop is running
2. Check that ports 3000 and 5000 are not in use by other applications
3. Try restarting Docker Desktop
4. Check the logs for specific error messages

For persistent issues, refer to the GitHub repository issues section.