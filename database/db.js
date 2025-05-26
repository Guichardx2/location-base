import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "locations.sqlite";
// Database configuração
const SQL_CREATE_ENTRIES = `CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

let _db = null;

export default function openDatabase() {
  
    if (!_db) {
        _db = SQLite.openDatabaseSync(DATABASE_NAME);
    }

    _db.withTransactionSync(() => {
        _db.execSync(SQL_CREATE_ENTRIES);
    });

    return _db;
}