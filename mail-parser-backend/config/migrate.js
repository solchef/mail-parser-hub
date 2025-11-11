import knex from 'knex';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
    migrations: {
        directory: resolve(__dirname, '../migrations'),
        tableName: 'knex_migrations',
    },
});

export async function migrate() {
    try {
        console.log('⏳ Running pending migrations...');
        await db.migrate.latest();
        console.log('✅ All migrations are up to date.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        throw err;
    } finally {
        await db.destroy();
    }
}
