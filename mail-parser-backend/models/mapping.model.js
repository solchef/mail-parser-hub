import { db } from "../config/connection.js";
import safeParse from '../utils/safe-parse.js'

export const MappingModel = {
    async all() {
        const rows = await db.selectFrom("mappings").selectAll().execute();
        return rows.map(r => ({
            ...r,
            mapping: safeParse(r.mapping),
            options: safeParse(r.options),
        }));
    },

    async findById(id) {
        const row = await db
            .selectFrom("mappings")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst();

        if (!row) return null;

        return {
            ...row,
            mapping: safeParse(row.mapping),
            options: safeParse(row.options),
        };
    },

    async create(data) {
        const payload = {
            ...data,
            mapping: JSON.stringify(data.mapping || {}),
            options: JSON.stringify(data.options || {}),
        };
        return db.insertInto("mappings").values(payload).execute();
    },

    async update(id, data) {
        const payload = {
            ...data,
            ...(data.mapping ? { mapping: JSON.stringify(data.mapping) } : {}),
            ...(data.options ? { options: JSON.stringify(data.options) } : {}),
        };
        return db.updateTable("mappings").set(payload).where("id", "=", id).execute();
    },

    async remove(id) {
        return db.deleteFrom("mappings").where("id", "=", id).execute();
    },
};
