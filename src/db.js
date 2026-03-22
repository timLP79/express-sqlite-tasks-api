const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use DB_PATH env var if set (e.g. ':memory:' in tests), otherwise default to project root
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

// Open the database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open database:', err.message);
    } else {
        console.log('Database opened at:', dbPath);
    }
});

// Initialize Schema
db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS tasks
         (
             id
             INTEGER
             PRIMARY
             KEY
             AUTOINCREMENT,
             title
             TEXT
             NOT
             NULL,
             done
             INTEGER
             NOT
             NULL
             DEFAULT
             0
         )`,
        (err) => {
            if (err) console.error('Failed to create tasks table:', err.message);
            else console.log('Schema ready: tasks');
        }
    );
});
module.exports = db;