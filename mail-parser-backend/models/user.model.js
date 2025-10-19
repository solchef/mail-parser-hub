import { db } from '../config/connection.js'

export const UserModel = {
    async all() {
        return await db.selectFrom("users").selectAll().execute();
    },

    async findById(id) {
        return await db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst();
    },

    async findByEmail(email) {
        return await db.selectFrom("users").selectAll().where("email", "=", email).executeTakeFirst();
    },

    async create(data) {
        await db.insertInto("users").values(data).execute();
        return data;
    },

    async update(id, data) {
        await db.updateTable("users").set(data).where("id", "=", id).execute();
        return data;
    },

    async remove(id) {
        await db.deleteFrom("users").where("id", "=", id).execute();
    },
};

