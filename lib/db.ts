import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "shop.db"));
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(process.cwd(), "db/schema.sql"), "utf8"));
db.exec(fs.readFileSync(path.join(process.cwd(), "db/seed.sql"), "utf8"));

export default db;
