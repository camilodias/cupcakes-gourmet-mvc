const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// --- Caminhos ---
const DB_FILE_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'database', 'cupcakes.db');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'database', 'schema.sql');
const SEED_PATH = path.join(__dirname, '..', '..', 'database', 'seed.sql');

let dbInstance = null;

// --- Conexão SQLite ---
function getDatabase(forceReset = false) {
  if (dbInstance && !forceReset) {
    return dbInstance;
  }

  if (forceReset) {
    if (dbInstance) {
      try {
        dbInstance.close();
      } catch (_) {}
      dbInstance = null;
    }
    if (DB_FILE_PATH !== ':memory:' && fs.existsSync(DB_FILE_PATH)) {
      fs.unlinkSync(DB_FILE_PATH);
    }
  }

  dbInstance = new DatabaseSync(DB_FILE_PATH);
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  dbInstance.exec(schemaSql);

  const countRow = dbInstance.prepare('SELECT COUNT(*) as total FROM cupcakes').get();
  if (!countRow || countRow.total === 0) {
    const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
    dbInstance.exec(seedSql);
  }

  return dbInstance;
}

module.exports = {
  getDatabase,
  DB_FILE_PATH
};
