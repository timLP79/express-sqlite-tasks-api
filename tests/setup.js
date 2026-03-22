// Run before any test module is loaded.
// Redirects SQLite to an in-memory DB so tests never touch data.db.
process.env.DB_PATH = ':memory:';
