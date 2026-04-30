# Docker Setup Guide for Campus Connect

## Prerequisites
- Docker installed on your machine
- Docker Compose installed

## Setup Instructions

### 1. Clone/Copy the repository to your machine
```bash
cd Campus_Connect
```

### 2. Create a `.env` file in the root directory
Copy from `.env.example` and update with your values:
```bash
cp Backend/.env.example .env
```

### 3. Update environment variables
Edit the `.env` file with your actual values:
```env
# Server
PORT=4000
FRONTEND_ORIGIN=http://127.0.0.1:5500,http://localhost:5500

# Database (PostgreSQL)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=campus_connect
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Security
JWT_SECRET=your_long_random_secret_here
OTP_PEPPER=your_another_random_secret_here

# Admin credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password
```

### 4. Build and start Docker containers
```bash
# Start all services (PostgreSQL + Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Or just PostgreSQL if you want to run backend locally
docker-compose up -d postgres
```

### 5. Verify services are running
```bash
# Check running containers
docker-compose ps

# Test backend API
curl http://localhost:4000/api/health
```

## Stopping Services

```bash
# Stop all containers
docker-compose down

# Stop containers and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Development Workflow

### Backend Development
- Edit code in `Backend/` folder
- Changes auto-reload in development mode (node --watch)
- Backend volume is mounted in docker-compose.yml

### Database Access
Connect to PostgreSQL from your machine:
```bash
# Using psql
psql -h localhost -U postgres -d campus_connect

# Password: postgres_password (or whatever you set in .env)
```

## Troubleshooting

### Database connection errors
- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Verify environment variables in `.env`

### Backend won't start
- Check logs: `docker-compose logs backend`
- Ensure all required env vars are set
- Try rebuilding: `docker-compose build --no-cache`

### Port already in use
- Change PORT in .env or docker-compose.yml
- Or kill existing process: `lsof -ti:5432 | xargs kill -9` (macOS/Linux)

## Important Notes

1. **Database Persistence**: The PostgreSQL data is stored in a Docker volume named `postgres_data`. This persists even after stopping containers.

2. **Shared Database**: Everyone using this setup will connect to the same PostgreSQL database, making it truly shared.

3. **Network**: Services communicate through the `campus_connect_network` Docker network.

4. **Environment Variables**: Always keep sensitive data in `.env` and never commit it to git.

## First Time Setup

After first `docker-compose up`:
1. Database tables are automatically created
2. Run your seed script if you have initial data
3. Backend should be accessible at `http://localhost:4000`

## Production Considerations

For production, consider:
- Use stronger passwords
- Set `NODE_ENV=production`
- Use environment-specific configuration
- Backup database regularly
- Use managed database services (AWS RDS, etc.)