const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "campus_connect",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Test connection
pool.on("error", (err) => {
  console.error("Unexpected connection pool error:", err);
});

// Helper function to run database queries (INSERT, UPDATE, DELETE)
async function run(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return {
      lastID: result.rows[0]?.id,
      changes: result.rowCount
    };
  } catch (error) {
    throw error;
  }
}

// Helper function to get a single row
async function get(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
}

// Helper function to get all rows
async function all(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows || [];
  } catch (error) {
    throw error;
  }
}

// Close database connection
async function close() {
  return pool.end();
}

module.exports = {
  pool,
  run,
  get,
  all,
  close
};
