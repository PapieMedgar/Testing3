# SaleSpace - Sales Management Application

## Overview
SaleSpace is a comprehensive web application for managing field sales operations, providing different interfaces for Agents, Managers, and Administrators. It enables tracking of sales visits, goals, and performance metrics.

## Features
- Role-based authentication (Admin, Manager, Agent)
- Dynamic dashboard based on user role
- Visit management with photo capture
- Goals tracking and management
- Brand and product management
- CSV export for reporting
- Responsive design with Shadcn UI
- State management with React Query
- Type-safe with TypeScript

## Prerequisites
- Node.js (v18+)
- npm or Bun
- Docker and Docker Compose (for containerized deployment)

## Setup and Installation

### Using Docker (Recommended)
1. Clone the repository
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Edit the `.env` file with your configuration
4. Start the application:
   ```bash
   # For development
   docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
   
   # For production
   docker-compose up -d
   ```

### Manual Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```
3. Configure backend API endpoint in `src/lib/api.ts`
4. Start development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

## User Roles
- **Agent**: Field sales representative
  - View assigned visits
  - Check-in to locations
  - Track visit history

- **Manager**: Supervise field agents
  - Monitor agent activities
  - Assign shops to agents
  - View team performance

- **Admin**: System administrator
  - Manage users and shops
  - View system-wide analytics
  - Configure system settings

## Environment Variables
- `VITE_API_URL`: Backend API base URL

## Technologies
- React
- TypeScript
- Shadcn UI
- React Router
- React Query
- Tailwind CSS

## Deployment Options

### Docker Deployment (Recommended)
The application includes Docker and Docker Compose configuration for easy deployment:

```bash
# Production deployment
docker-compose up -d

# Scale services if needed
docker-compose up -d --scale backend=3
```

### Manual Deployment
Build for production:
```bash
npm run build
# or
bun run build
```

Deploy the built files from the `dist` directory to your web server.

## Environment Configuration
The application supports different environments:

- **Development**: Uses the configuration in `docker-compose.override.yml`
- **Production**: Uses the configuration in `docker-compose.yml`

You can switch between environments by using the appropriate Docker Compose command:

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Production
docker-compose up -d
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a pull request

## Troubleshooting
- If you encounter issues with Docker, ensure Docker and Docker Compose are properly installed
- For database connection issues, check the database credentials in your `.env` file
- For API connection issues, verify the API base URL in your environment configuration
