const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { run } = require('../db');

(async () => {
  try {
    const password = process.env.TEST_USER_PASSWORD || 'Password123!';
    const hash = bcrypt.hashSync(password, 10);
    const created = Date.now();

    await run(
      `INSERT INTO users (account_type, first_name, last_name, reg_no, department, program_or_unit, year_or_designation, email, username, password_hash, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        'Student',
        'Nikhil',
        'Singhal',
        'REG12345',
        'Computer Science',
        'BTech',
        '3',
        'nikhilsinghal2019@gmail.com',
        'nikhilsinghal2019',
        hash,
        created
      ]
    );

    console.log('User created: nikhilsinghal2019 (password: ' + password + ')');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create user:', err);
    process.exit(1);
  }
})();
