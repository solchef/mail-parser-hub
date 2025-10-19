import { DBConnectionModel } from "../models/dbConnection.model.js"
import { createDBConnection } from "../services/knex-connection.js"

//  CREATE (save connection)
export const saveConnection = async (req, res) => {
    try {
        const conn = {
            ...req.body,
            id: req.body.id || `db_${Date.now()}`,
            createdAt: new Date().toISOString(),
        }

        await DBConnectionModel.create(conn)
        res.json(conn)
    } catch (err) {
        console.error("Error saving connection:", err)
        res.status(500).json({ error: err.message })
    }
}

//  READ (list connections)
export const listConnections = async (req, res) => {
    try {
        const connections = await DBConnectionModel.all()
        res.json(connections)
    } catch (err) {
        console.error("Error listing connections:", err)
        res.status(500).json({ error: err.message })
    }
}

//  DELETE CONNECTION
export const deleteConnection = async (req, res) => {
    const { id } = req.params

    try {
        const conn = await DBConnectionModel.findById(id)
        if (!conn) {
            return res.status(404).json({ error: "Connection not found" })
        }

        await DBConnectionModel.remove(id)
        res.json({ success: true, message: "Connection deleted successfully" })
    } catch (err) {
        console.error("Error deleting connection:", err)
        res.status(500).json({ error: err.message })
    }
}

//  TEST CONNECTION
export const testConnection = async (req, res) => {
    const config = req.body

    try {
        const dbConn = createDBConnection(config)
        await dbConn.raw("SELECT 1")
        await dbConn.destroy()

        res.json({ success: true, message: "Database connection successful!" })
    } catch (err) {
        console.error("Database test failed:", err)
        res.status(500).json({ success: false, message: err.message })
    }
}

//  LIST TABLES
export const listTables = async (req, res) => {
    const { connectionId } = req.query

    try {
        const connection = await DBConnectionModel.findById(connectionId)
        if (!connection) {
            return res.status(404).json({ error: "Connection not found" })
        }

        const dbConn = createDBConnection(connection)
        let tables = []
        const type = connection.type?.toLowerCase()

        if (type === "mysql") {
            tables = await dbConn
                .select("TABLE_NAME")
                .from("INFORMATION_SCHEMA.TABLES")
                .where("TABLE_SCHEMA", connection.database)
                .pluck("TABLE_NAME")
        } else if (type === "mssql") {
            tables = await dbConn
                .select("TABLE_NAME")
                .from("INFORMATION_SCHEMA.TABLES")
                .pluck("TABLE_NAME")
        } else if (type === "postgres") {
            tables = await dbConn
                .select("table_name")
                .from("information_schema.tables")
                .where("table_schema", "public")
                .pluck("table_name")
        }

        await dbConn.destroy()
        res.json({ tables })
    } catch (err) {
        console.error("Error listing tables:", err)
        res.status(500).json({ error: err.message })
    }
}

//  LIST TABLE COLUMNS
export const listTableColumns = async (req, res) => {
    const { connectionId, table } = req.query

    try {
        const connection = await DBConnectionModel.findById(connectionId)
        if (!connection) {
            return res.status(404).json({ error: "Connection not found" })
        }

        const dbConn = createDBConnection(connection)
        let columns = []
        const type = connection.type?.toLowerCase()

        if (type === "mysql") {
            columns = await dbConn
                .select("COLUMN_NAME")
                .from("INFORMATION_SCHEMA.COLUMNS")
                .where("TABLE_SCHEMA", connection.database)
                .andWhere("TABLE_NAME", table)
                .pluck("COLUMN_NAME")
        } else if (type === "mssql") {
            columns = await dbConn
                .select("COLUMN_NAME")
                .from("INFORMATION_SCHEMA.COLUMNS")
                .where("TABLE_NAME", table)
                .pluck("COLUMN_NAME")
        }

        await dbConn.destroy()
        res.json({ columns })
    } catch (err) {
        console.error("Error listing columns:", err)
        res.status(500).json({ error: err.message })
    }
}

// Analyze CSV schema
export const analyzeCSVSchema = async (req, res) => {
    try {
        const { rows } = req.body;
        if (!rows || !rows.length) {
            return res.status(400).json({ error: "No rows provided" });
        }

        // Use first few rows to analyze types
        const sampleRows = rows.slice(1, 10);
        const firstRow = sampleRows[0];

        const schema = Object.keys(firstRow).map((originalKey) => {

            const safeKey = originalKey
                .trim()
                .replace(/\s+/g, "_")
                .replace(/[^\w_]/g, "").toLowerCase()

            const values = sampleRows.map((r) =>
                (r[originalKey] ?? "").toString().trim()
            );

            const inferredType = inferType(values);

            return {
                originalName: originalKey,
                suggestedName: safeKey,
                inferredType,
                sampleValue: firstRow[originalKey],
                nullable: values.some((v) => v === ""),
            };
        });

        console.log(schema)

        res.json({ schema });
    } catch (err) {
        console.error("Error analyzing CSV schema:", err);
        res.status(500).json({ error: err.message });
    }
};

// 🔍 Helper function to infer column type
function inferType(values) {
    let isInteger = true;
    let isBoolean = true;
    let isDate = true;
    let isText = false;

    for (const val of values) {
        if (val === "") continue; // skip empty values

        // numeric?
        if (isNaN(val)) isInteger = false;

        // boolean?
        const lower = val.toLowerCase();
        if (!["true", "false", "yes", "no", "0", "1"].includes(lower))
            isBoolean = false;

        // date?
        if (!isValidDate(val)) isDate = false;

        // text?
        if (val.length > 255) isText = true;
    }

    if (isInteger) return "integer";
    if (isBoolean) return "boolean";
    if (isDate) return "date";
    if (isText) return "text";
    return "string";
}

function isValidDate(value) {
    const d = new Date(value);
    return !isNaN(d.getTime()) && value.length >= 6;
}


// Create table based on confirmed schema
export const createTableFromSchema = async (req, res) => {
    const { connectionId, tableName, schema } = req.body;

    try {
        if (!schema?.length) {
            return res.status(400).json({ error: "No schema provided" });
        }

        const connection = await DBConnectionModel.findById(connectionId);
        if (!connection) {
            return res.status(404).json({ error: "Connection not found" });
        }

        const dbConn = createDBConnection(connection);
        const exists = await dbConn.schema.hasTable(tableName);

        if (exists) {
            await dbConn.destroy();
            return res.status(400).json({ error: `Table "${tableName}" already exists` });
        }

        await dbConn.schema.createTable(tableName, (t) => {
            t.increments("id").primary();
            for (const col of schema) {
                const name = col.name

                switch (col.inferredType) {
                    case "integer":
                        t.integer(name).nullable();
                        break;
                    case "boolean":
                        t.boolean(name).nullable();
                        break;
                    case "date":
                        t.dateTime(name).nullable();
                        break;
                    case "text":
                        t.text(name).nullable();
                        break;
                    default:
                        t.string(name, 255).nullable();
                }
            }
        });

        await dbConn.destroy();
        res.json({ success: true, message: `✅ Table "${tableName}" created successfully!` });
    } catch (err) {
        console.error("Error creating table:", err);
        res.status(500).json({ error: err.message });
    }
};
