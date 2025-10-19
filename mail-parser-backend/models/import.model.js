import { db } from "../config/connection.js";
import safeParse from '../utils/safe-parse.js'


export const ImportModel = {
    async all() {
        const rows = await db.selectFrom("imports").selectAll().execute();
        return rows.map(r => ({
            ...r,
            errors: safeParse(r.errors),
        }));
    },

    async findById(id) {
        const row = await db
            .selectFrom("imports")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst();

        if (!row) return null;

        return {
            ...row,
            errors: safeParse(row.errors),
        };
    },

    async findByFile(fileId) {
        const row = await db
            .selectFrom("imports")
            .selectAll()
            .where("fileId", "=", fileId)
            .executeTakeFirst();

        if (!row) return null;

        return {
            ...row,
            errors: safeParse(row.errors),
        };
    },

    async create(data) {
        const payload = {
            ...data,
            errors: JSON.stringify(data.errors || []),
        };
        return db.insertInto("imports").values(payload).execute();
    },

    async update(id, data) {
        const payload = {
            ...data,
            ...(data.errors ? { errors: JSON.stringify(data.errors) } : {}),
        };
        return db.updateTable("imports").set(payload).where("id", "=", id).execute();
    },

    async remove(id) {
        return db.deleteFrom("imports").where("id", "=", id).execute();
    },
};
