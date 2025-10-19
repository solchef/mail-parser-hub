import { db } from '../config/connection.js'

export const DBConnectionModel = {
    async all() {
        return db.selectFrom('dbConnections').selectAll().execute()
    },
    async findById(id) {
        return db.selectFrom('dbConnections').selectAll().where('id', '=', id).executeTakeFirst()
    },
    async create(data) {
        return db.insertInto('dbConnections').values(data).execute()
    },
    async update(id, data) {
        return db.updateTable('dbConnections').set(data).where('id', '=', id).execute()
    },
    async remove(id) {
        return db.deleteFrom('dbConnections').where('id', '=', id).execute()
    },
}
