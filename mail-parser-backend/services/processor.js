import fs from 'fs';
import { parse } from 'csv-parse/sync';
import mysql from 'mysql2/promise';
import mssql from 'mssql';

export async function previewCsv(filePath, { maxRows = 10, delimiter = ',' } = {}) {
    const txt = fs.readFileSync(filePath, 'utf8');
    const records = parse(txt, { skip_empty_lines: true, relax_column_count: true, delimiter });
    return records.slice(0, maxRows);
}

export async function importMappedRows(mappedRows, dbConfig, options = {}) {
    if (!mappedRows || mappedRows.length === 0) return 0;

    if (dbConfig.type === 'mysql') {
        return await importToMySQL(mappedRows, dbConfig, options);
    }

    if (dbConfig.type === 'mssql') {
        return await importToMSSQL(mappedRows, dbConfig, options);
    }

    throw new Error('Unsupported DB type: ' + dbConfig.type);
}

async function importToMySQL(rows, dbConfig, options) {
    const conn = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port || 3306,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
    });

    const table = dbConfig.table;

    if (options.truncate) {
        await conn.query(`DELETE FROM \`${table}\``);
    }

    const cols = Object.keys(rows[0]);
    const placeholders = rows.map(() => `(${cols.map(() => '?').join(',')})`).join(',');
    const sql = `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(',')}) VALUES ${placeholders}`;
    const values = rows.flatMap((r) => cols.map((c) => r[c]));

    const [result] = await conn.query(sql, values);
    await conn.end();

    return result.affectedRows || 0;
}

async function importToMSSQL(rows, dbConfig, options) {
    const config = {
        user: dbConfig.user,
        password: dbConfig.password,
        server: dbConfig.host,
        port: Number(dbConfig.port || 1433),
        database: dbConfig.database,
        options: { trustServerCertificate: true },
    };

    const pool = await mssql.connect(config);
    const table = dbConfig.table;

    if (options.truncate) {
        await pool.request().query(`DELETE FROM ${table};`);
    }

    const cols = Object.keys(rows[0]);
    const tx = new mssql.Transaction(pool);

    await tx.begin();
    try {
        let inserted = 0;
        for (const r of rows) {
            const colsList = cols.join(',');
            const params = cols.map((_, i) => `@p${i}`).join(',');
            const q = `INSERT INTO ${table} (${colsList}) VALUES (${params});`;
            const req = new mssql.Request(tx);
            cols.forEach((c, i) => req.input(`p${i}`, r[c] === '' ? null : r[c]));
            const res = await req.query(q);
            inserted += res.rowsAffected.reduce((a, b) => a + b, 0);
        }
        await tx.commit();
        await pool.close();
        return inserted;
    } catch (err) {
        await tx.rollback();
        await pool.close();
        throw err;
    }
}
