const config = require('./config');
let db;

if (config.db.enabled) {
  if (config.db.type === 'mysql') {
    const mysql = require('mysql2/promise');
    db = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    });
  } else {
    const { Pool } = require('pg');
    db = new Pool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    });
  }
}

module.exports = db;
