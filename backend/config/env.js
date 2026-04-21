const path = require('path');
const dotenv = require('dotenv');

/** Always load `.env` from project root, regardless of cwd. */
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath, override: true });

if (result.error && result.error.code !== 'ENOENT') {
  console.warn('dotenv:', result.error.message);
}

module.exports = { envPath };
