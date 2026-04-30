# Accessing the Campus Connect Database

This document explains how to access the PostgreSQL database used by the Campus Connect backend.

Files and credentials
- Environment variables live in `.env` (root). See `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

Quick overview
- Database service name (Docker): `postgres` (container `campus_connect_db`)
- Local host port: `5432`
- Default database: `campus_connect`

1) Using Docker (recommended when you don't have a local psql client)
- Open an interactive psql shell inside the running container:

```bash
docker exec -it campus_connect_db psql -U postgres -d campus_connect
```

- Run a single query from host:

```bash
docker exec -i campus_connect_db psql -U postgres -d campus_connect -c "SELECT count(*) FROM users;"
```

2) Using a local psql client
- Install `psql` (Postgres client) for your OS, then run:

```bash
psql -h localhost -p 5432 -U postgres -d campus_connect
# enter the password from .env when prompted
```

3) Connection string (for apps/clients)
- URI form:

```
postgres://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
# example:
postgres://postgres:secure_db_password_123@localhost:5432/campus_connect
```

4) From Node.js (example using `pg`)

```js
// Backend/db.js already reads env vars. Example using pg.Pool:
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const res = await pool.query('SELECT * FROM users LIMIT 5');
console.log(res.rows);
```

5) GUI tools
- Use pgAdmin, DBeaver, TablePlus, or TablePlus alternatives.
  - Host: `localhost`
  - Port: `5432`
  - Username: value in `.env` (`DB_USER`)
  - Password: value in `.env` (`DB_PASSWORD`)
  - Database: `campus_connect`

6) Useful queries
```sql
-- list tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- count rows
SELECT count(*) FROM users;

-- see sample rows
SELECT id, email, username, created_at FROM users ORDER BY created_at DESC LIMIT 10;
```

7) Troubleshooting
- Check containers:

```bash
docker ps
# show compose services
docker-compose ps
```

- View Postgres logs:

```bash
docker-compose logs -f postgres
```

- Containers not starting? restart Postgres (keeps data in volume):

```bash
docker-compose restart postgres
```

- If port 5432 is used by another process, change `DB_PORT` in `.env` and `docker-compose.yml`.

8) Security & notes
- Do not commit `.env` to git. `.env` contains secrets.
- For team use, share `.env` securely or use a secrets manager.
- Data persists in the Docker volume `postgres_data`. To remove data run `docker-compose down -v` (destructive).

9) Extra: run a quick sample from the repo root

```bash
# start services if not running
docker-compose up -d

# run a query to list tables
docker exec -i campus_connect_db psql -U postgres -d campus_connect -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

If you want, I can add sample GUI screenshots, a small SQL seed file, or query helper scripts—tell me which you'd prefer.