const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production" || 
                     (process.env.DB_HOST && 
                      process.env.DB_HOST !== "localhost" && 
                      process.env.DB_HOST !== "127.0.0.1");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "campus_connect",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on("error", (err) => {
  console.error("Unexpected connection pool error:", err);
});

// Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
function convertPlaceholders(sql, params) {
  // If no params or no '?' present, return as-is for performance
  if (!params || params.length === 0 || sql.indexOf('?') === -1) {
    return { text: sql, values: params };
  }

  let idx = 0;
  const text = sql.replace(/\?/g, () => {
    idx += 1;
    return `$${idx}`;
  });

  return { text, values: params };
}

// Helper function to run database queries (INSERT, UPDATE, DELETE)
async function run(sql, params = []) {
  try {
    const { text, values } = convertPlaceholders(sql, params);
    const result = await pool.query(text, values);
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
    const { text, values } = convertPlaceholders(sql, params);
    const result = await pool.query(text, values);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
}

// Helper function to get all rows
async function all(sql, params = []) {
  try {
    const { text, values } = convertPlaceholders(sql, params);
    const result = await pool.query(text, values);
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
