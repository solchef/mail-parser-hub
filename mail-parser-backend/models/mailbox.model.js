import { db } from "../config/connection.js";
import safeParse from '../utils/safe-parse.js'


export const MailboxModel = {
    async all() {
        const rows = await db.selectFrom("mailboxes").selectAll().execute();
        return rows.map(r => ({
            ...r,
            gmailConfig: safeParse(r.gmailConfig),
            imapConfig: safeParse(r.imapConfig),
        }));
    },

    async findById(id) {
        const row = await db
            .selectFrom("mailboxes")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst();

        if (!row) return null;

        return {
            ...row,
            gmailConfig: safeParse(row.gmailConfig),
            imapConfig: safeParse(row.imapConfig),
        };
    },

    async create(data) {
        const payload = {
            ...data,
            gmailConfig: JSON.stringify(data.gmailConfig || {}),
            imapConfig: JSON.stringify(data.imapConfig || {}),
        };

        return db.insertInto("mailboxes").values(payload).execute();
    },

    async update(id, data) {
        const payload = {
            ...data,
            ...(data.gmailConfig !== undefined
                ? { gmailConfig: JSON.stringify(data.gmailConfig) }
                : {}),
            ...(data.imapConfig !== undefined
                ? { imapConfig: JSON.stringify(data.imapConfig) }
                : {}),
        };

        return db.updateTable("mailboxes").set(payload).where("id", "=", id).execute();
    },

    async remove(id) {
        return db.deleteFrom("mailboxes").where("id", "=", id).execute();
    },
};
