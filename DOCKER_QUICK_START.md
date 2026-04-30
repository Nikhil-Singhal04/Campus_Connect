# Campus Connect - Global PostgreSQL Database Setup Complete! ✓

## What Changed

Your application now uses **PostgreSQL in Docker** as a shared database for your entire team.

### Files Created:
- `docker-compose.yml` - Docker Compose configuration for PostgreSQL + Backend
- `Backend/Dockerfile` - Backend Node.js container setup
- `Backend/init-db.js` - PostgreSQL database initialization script
- `Backend/db.js` - Global database connection module (updated for PostgreSQL)
- `DOCKER_SETUP.md` - Complete setup and troubleshooting guide

### Files Updated:
- `Backend/server.js` - Now imports from db.js and init-db.js
- `Backend/package.json` - Replaced sqlite3 with pg (PostgreSQL driver)
- `Backend/.env.example` - Added PostgreSQL environment variables

## Quick Start

### 1. First time setup:
```bash
cd Campus_Connect
docker-compose up -d
```

This will:
- Start a PostgreSQL database container
- Build and start the Backend Node.js container
- Automatically initialize database tables
- Make everything available at `http://localhost:4000`

### 2. Create .env file (if not exists):
```bash
cp Backend/.env.example .env
```

Then edit the `.env` file with your actual values (especially JWT_SECRET and OTP_PEPPER).

### 3. Stop services:
```bash
docker-compose down
```

## How Everyone Uses the Same Database

1. **Persistent Volume**: PostgreSQL data is stored in a Docker volume that persists across restarts
2. **Network Access**: The backend connects to PostgreSQL automatically
3. **Team Access**: Everyone running `docker-compose up` connects to the same database
4. **Shared Credentials**: All connections use the same DB_USER and DB_PASSWORD from `.env`

## Important Environment Variables

```env
# Database Connection
DB_HOST=postgres          # Docker service name
DB_PORT=5432             # PostgreSQL default port
DB_NAME=campus_connect   # Database name
DB_USER=postgres         # Admin user
DB_PASSWORD=your_password # Keep secure!

# JWT Security (CHANGE THESE!)
JWT_SECRET=long_random_string
OTP_PEPPER=another_random_string

# Admin Access
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_password
```

## Database Access

Connect directly to PostgreSQL (optional):
```bash
# Using Docker exec
docker exec -it campus_connect_db psql -U postgres -d campus_connect

# Using psql from your machine
psql -h localhost -U postgres -d campus_connect
```

## Common Commands

```bash
# View logs
docker-compose logs backend
docker-compose logs postgres

# Rebuild containers
docker-compose build

# Remove everything (including database!)
docker-compose down -v

# Check container status
docker-compose ps
```

## Next Steps

1. Update your `.env` file with real JWT_SECRET and OTP_PEPPER
2. Set Admin credentials in `.env`
3. Run `docker-compose up -d`
4. Test: `curl http://localhost:4000/api/health`
5. Share the `.env` file securely with your team (or use a secrets manager)

For detailed information, see [DOCKER_SETUP.md](DOCKER_SETUP.md)

---
**Note**: Keep `.env` out of git version control! It contains sensitive data.
