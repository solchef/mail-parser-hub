import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = process.env.LOWDB_FILE || path.join(__dirname, '../db/data.json');
const adapter = new JSONFile(file);

// ✅ Pass default data here
const defaultData = {
    tenants: [],
    mailboxes: [],
    files: [],
    mappings: [],
    dbConnections: [],
    imports: [],
};

const db = new Low(adapter, defaultData);

export async function init() {
    // Ensure DB directory exists
    if (!fs.existsSync(path.dirname(file))) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
    }

    // Read database (or initialize)
    await db.read();

    if (!db.data) {
        db.data = defaultData;
        await db.write();
    }
}

export { db };
