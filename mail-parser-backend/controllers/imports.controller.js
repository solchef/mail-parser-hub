import fs from "fs";
import { parse } from "csv-parse/sync";
import { createDBConnection } from "../services/knex-connection.js";
import { normalizeDateValue } from "../utils/common.js";
import { FileModel } from "../models/file.model.js";
import { MappingModel } from "../models/mapping.model.js";
import { DBConnectionModel } from "../models/dbConnection.model.js";
import { ImportModel } from "../models/import.model.js";
import { getAttachment } from "../utils/get-attachment.js";

async function getTableColumns(dbConn, table, dbType, databaseName) {
    let cols = [];

    if (dbType === "mysql") {
        cols = await dbConn
            .select("COLUMN_NAME", "DATA_TYPE")
            .from("INFORMATION_SCHEMA.COLUMNS")
            .where("TABLE_SCHEMA", databaseName)
            .andWhere("TABLE_NAME", table);
    } else if (dbType === "mssql") {
        cols = await dbConn
            .select("COLUMN_NAME", "DATA_TYPE")
            .from("INFORMATION_SCHEMA.COLUMNS")
            .where("TABLE_NAME", table);
    }

    return cols.map(c => ({
        name: c.COLUMN_NAME,
        type: c.DATA_TYPE?.toLowerCase(),
    }));
}

export async function processImport(req, res) {
    const { fileId, mappingId, truncate = false } = req.body;
    console.log("processImport request body:", req.body);

    const file = await FileModel.findById(fileId);
    if (!file) return res.status(404).json({ error: `File with ID ${fileId} not found` });

    const mappingEntry = await MappingModel.findById(mappingId);
    if (!mappingEntry) return res.status(404).json({ error: `Mapping with ID ${mappingId} not found` });

    const dbConnEntry = await DBConnectionModel.findById(mappingEntry.connectionId);

    const importLog = {
        id: generateUUID(),
        fileId: file.id,
        filename: file.filename,
        mappingId,
        status: "pending",
        importedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        recordsImported: 0,
        errors: []
    };

    try {
        // 🔹 Load CSV (works for local or Drive)
        const { buffer } = await getAttachment({
            driveFileId: file.driveFileId,
            savedPath: file.savedPath,
        });

        const txt = buffer.toString("utf8");
        const rows = parse(txt, { columns: true, skip_empty_lines: true });

        if (!rows.length) throw new Error("CSV file is empty");

        const dbConn = createDBConnection(dbConnEntry);
        const table = mappingEntry.table;
        const dbType = dbConnEntry.type?.toLowerCase();
        const dbColumns = await getTableColumns(dbConn, table, dbType, dbConnEntry.database);

        const mappedRows = rows.map(r => {
            const out = {};
            for (const [csvCol, dbCol] of Object.entries(mappingEntry.mapping)) {
                if (!dbCol || dbCol === "skip") continue;

                const colMeta = dbColumns.find(c => c.name === dbCol);
                let val = r[csvCol];

                if (val == null || val === "") {
                    out[dbCol] = null;
                    continue;
                }

                if (colMeta) {
                    const t = colMeta.type;
                    if (t.includes("date") || t.includes("time")) {
                        val = normalizeDateValue(val);
                    } else if (t.includes("int") || t.includes("decimal") || t.includes("float") || t.includes("numeric")) {
                        val = parseFloat(val) || null;
                    } else if (t.includes("bool")) {
                        val = ["true", "1", "yes"].includes(String(val).toLowerCase());
                    } else {
                        val = val.toString().trim();
                    }
                }

                out[dbCol] = val;
            }
            return out;
        });

        await ensureTableExists(dbConn, table, mappedRows[0]);

        if (truncate) await dbConn(table).del();

        await dbConn.batchInsert(table, mappedRows);
        await dbConn.destroy();

        file.status = "processed";
        importLog.status = "success";
        importLog.recordsImported = mappedRows.length;

        await FileModel.update(file.id, { status: "processed" });
    } catch (err) {
        console.error("Import error:", err);
        file.status = "failed";
        importLog.status = "failed";
        importLog.errors.push(err.message);
        await FileModel.update(file.id, { status: "failed" });
    }

    importLog.errors = Array.isArray(importLog.errors)
        ? JSON.stringify(importLog.errors)
        : JSON.stringify([]);

    await ImportModel.create({
        ...importLog,
        recordsImported: importLog.recordsImported || 0,
    });

    res.json({
        importLog,
        message: `Import completed with status ${importLog.status}. ${importLog.recordsImported} records processed.`
    });
}
async function ensureTableExists(dbConn, table, sampleRow) {
    const exists = await dbConn.schema.hasTable(table);
    if (exists) return;

    await dbConn.schema.createTable(table, (t) => {
        t.increments("id").primary();
        for (const col of Object.keys(sampleRow)) {
            t.string(col);
        }
    });
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function listImports(req, res) {
    const imports = await ImportModel.all();
    res.json(imports || []);
}

export async function saveMappingAndImport(req, res) {
    const { fileId, connectionId, table, mapping, options } = req.body;

    const mapId = `map_${Date.now()}`;
    await MappingModel.create({
        id: mapId,
        fileId,
        connectionId,
        table,
        mapping,
        options,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    req.body.dbConfig = await DBConnectionModel.findById(connectionId);
    req.body.dbConfig.table = table;
    req.body.mapping = mapping;
    req.body.options = options;
    req.params.id = fileId;

    return processImport(req, res); // reuse existing import processor
}


export async function retryImport(req, res) {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: "Missing id" });

        const importEntry = await ImportModel.findById(id);
        if (!importEntry) return res.status(404).json({ error: `Import with ID ${id} not found` });

        const fileId = importEntry.fileId;
        if (!fileId) return res.status(400).json({ error: "Import record missing fileId" });

        // Delete the failed import log
        await ImportModel.remove(id);

        // Update the file back to "pending"
        await FileModel.update(fileId, { status: "pending" });

        res.json({
            message: `Import ${id} deleted and file ${fileId} reset to pending.`,
            fileId,
            id,
        });
    } catch (err) {
        console.error("retryImport error:", err);
        res.status(500).json({
            error: "Failed to retry import",
            details: err.message,
        });
    }
}
