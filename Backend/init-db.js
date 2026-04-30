const { pool, run, get, all } = require("./db");

async function initializeDatabase() {
  try {
    console.log("Initializing PostgreSQL database...");

    // Create OTP challenges table
    await run(`
      CREATE TABLE IF NOT EXISTS otp_challenges (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        verified INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL
      )
    `);

    // Create users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        account_type TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        reg_no TEXT NOT NULL,
        department TEXT NOT NULL,
        program_or_unit TEXT NOT NULL,
        year_or_designation TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);

    // Create events table
    await run(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        event_type TEXT NOT NULL,
        department TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        event_price TEXT NOT NULL DEFAULT 'Free',
        max_team_size INTEGER NOT NULL DEFAULT 6,
        poster_image TEXT,
        approval_status TEXT NOT NULL DEFAULT 'Pending',
        edit_change_summary TEXT,
        edit_requested_at BIGINT,
        delete_request_reason TEXT,
        delete_requested_at BIGINT,
        organizer_id INTEGER NOT NULL,
        created_by TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create event registrations table
    await run(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        year_or_designation TEXT,
        notes TEXT,
        pricing_label TEXT NOT NULL DEFAULT 'Free Entry',
        payment_path TEXT,
        created_at BIGINT NOT NULL,
        UNIQUE(event_id, user_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await run(`CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_otp_challenges_email ON otp_challenges(email)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

    console.log("Database initialized successfully!");
    return true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

module.exports = { initializeDatabase };
