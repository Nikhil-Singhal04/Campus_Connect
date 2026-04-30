const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const sqlitePath = path.join(__dirname, 'auth.db');
const sdb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open sqlite db:', err);
    process.exit(1);
  }
});

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'campus_connect',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

function allSqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sdb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function migrate() {
  try {
    console.log('Reading sqlite tables...');

    const otpChallenges = await allSqlite('SELECT * FROM otp_challenges');
    const users = await allSqlite('SELECT * FROM users');
    const events = await allSqlite('SELECT * FROM events');
    const registrations = await allSqlite('SELECT * FROM event_registrations');

    console.log(`Found rows - otp_challenges:${otpChallenges.length}, users:${users.length}, events:${events.length}, registrations:${registrations.length}`);

    // Insert users
    for (const u of users) {
      const params = [
        u.id,
        u.account_type,
        u.first_name,
        u.last_name,
        u.reg_no,
        u.department,
        u.program_or_unit,
        u.year_or_designation,
        u.email,
        u.username,
        u.password_hash,
        u.created_at
      ];
      await pool.query(
        `INSERT INTO users (id, account_type, first_name, last_name, reg_no, department, program_or_unit, year_or_designation, email, username, password_hash, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO NOTHING`,
        params
      );
    }

    // Insert events
    for (const e of events) {
      const params = [
        e.id,
        e.title,
        e.event_type,
        e.department,
        e.date,
        e.time,
        e.location,
        e.description,
        e.event_price ?? 'Free',
        e.max_team_size ?? 6,
        e.poster_image ?? null,
        e.approval_status ?? 'Pending',
        e.edit_change_summary ?? null,
        e.edit_requested_at ?? null,
        e.delete_request_reason ?? null,
        e.delete_requested_at ?? null,
        e.organizer_id,
        e.created_by,
        e.created_at
      ];
      await pool.query(
        `INSERT INTO events (id, title, event_type, department, date, time, location, description, event_price, max_team_size, poster_image, approval_status, edit_change_summary, edit_requested_at, delete_request_reason, delete_requested_at, organizer_id, created_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO NOTHING`,
        params
      );
    }

    // Insert registrations
    for (const r of registrations) {
      const params = [
        r.id,
        r.event_id,
        r.user_id,
        r.full_name,
        r.email,
        r.phone,
        r.year_or_designation ?? null,
        r.notes ?? null,
        r.pricing_label ?? 'Free Entry',
        r.payment_path ?? null,
        r.created_at
      ];
      await pool.query(
        `INSERT INTO event_registrations (id, event_id, user_id, full_name, email, phone, year_or_designation, notes, pricing_label, payment_path, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        params
      );
    }

    // Insert otp_challenges
    for (const o of otpChallenges) {
      const params = [
        o.id,
        o.email,
        o.code_hash,
        o.expires_at,
        o.attempts,
        o.verified,
        o.created_at
      ];
      await pool.query(
        `INSERT INTO otp_challenges (id, email, code_hash, expires_at, attempts, verified, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        params
      );
    }

    // Update sequences for each table
    const tables = ['users','events','event_registrations','otp_challenges'];
    for (const t of tables) {
      const seqRes = await pool.query(`SELECT pg_get_serial_sequence($1,'id') AS seq`, [t]);
      const seqName = seqRes.rows[0] && seqRes.rows[0].seq;
      if (seqName) {
        // Ensure sequence is at least 1 to avoid out-of-bounds error
        await pool.query(`SELECT setval('${seqName}', (SELECT COALESCE(MAX(id),1) FROM ${t}))`);
      }
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    sdb.close(() => {});
    await pool.end();
  }
}

migrate();
