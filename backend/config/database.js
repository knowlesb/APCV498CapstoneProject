require('./env');

const path = require('path');
const mysql = require('mysql2/promise');

const mysqlUrl = (process.env.MYSQL_URL || '').trim();

const mysqlConfig = mysqlUrl
  ? { uri: mysqlUrl }
  : {
      host: (process.env.MYSQL_HOST || '').trim(),
      port: Number(process.env.MYSQL_PORT || 3306),
      user: (process.env.MYSQL_USER || '').trim(),
      password: process.env.MYSQL_PASSWORD || '',
      database: (process.env.MYSQL_DATABASE || '').trim()
    };

const hasUrl = Boolean(mysqlUrl);
const hasDiscrete =
  Boolean(mysqlConfig.host) &&
  Boolean(mysqlConfig.user) &&
  Boolean(mysqlConfig.database);

if (!hasUrl && !hasDiscrete) {
  console.error(
    'MySQL configuration is missing. Set MYSQL_URL or MYSQL_HOST/MYSQL_PORT/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE in .env at:',
    path.resolve(__dirname, '../../.env')
  );
  process.exit(1);
}

const pool = mysql.createPool({
  ...mysqlConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

