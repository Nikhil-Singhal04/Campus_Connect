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

    // Create contact messages table
    await run(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        replied_at BIGINT,
        reply_subject TEXT,
        reply_message TEXT
      )
    `);

    // Create community posts table
    await run(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        author_user_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        text TEXT NOT NULL,
        club TEXT,
        like_count INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await run(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS club TEXT`);

    // Create community comments table
    await run(`
      CREATE TABLE IF NOT EXISTS community_post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL,
        author_user_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Track post likes per user
    await run(`
      CREATE TABLE IF NOT EXISTS community_post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at BIGINT NOT NULL,
        UNIQUE(post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Event discussion messages table
    await run(`
      CREATE TABLE IF NOT EXISTS event_discussion_messages (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Clubs and memberships tables
    await run(`
      CREATE TABLE IF NOT EXISTS clubs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS club_memberships (
        id SERIAL PRIMARY KEY,
        club_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at BIGINT NOT NULL,
        UNIQUE(club_id, user_id),
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
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
    await run(`CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_community_posts_club ON community_posts(club)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_post_comments(post_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_post_likes(post_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_event_discussion_messages_event_id ON event_discussion_messages(event_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id)`);

    // Seed default clubs on every startup so missing canonical IDs are restored.
    const defaultClubs = [
      ["coding", "Coding Club", "Algorithms, contests and hackathons."],
      ["design", "Design & UX", "Workshops and portfolio reviews."],
      ["entrepreneurship", "Entrepreneurship", "Startup ideas, pitching and mentorship."],
      ["cultural", "Cultural Club", "Events, performances and festivals."],
      ["sports", "Sports Club", "Matches, fitness and team activities."],
      ["agri", "AgriClub", "Agriculture, sustainability and campus farming."]
    ];

    for (const [id, name, description] of defaultClubs) {
      await run(
        `INSERT INTO clubs (id, name, description, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, description, Date.now()]
      );
    }

    console.log("Database initialized successfully!");
    return true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

module.exports = { initializeDatabase };
