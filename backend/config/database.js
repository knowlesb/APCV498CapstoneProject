require('./env');

const path = require('path');
const { Pool } = require('pg');

const dbUrl = (process.env.DATABASE_URL || '').trim();
if (!dbUrl) {
  console.error(
    'DATABASE_URL is missing. Add it to .env at project root:',
    path.resolve(__dirname, '../../.env')
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

