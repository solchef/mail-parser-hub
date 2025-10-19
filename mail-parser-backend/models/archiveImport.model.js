import { db } from '../config/connection.js'

export const ArchivedFileModel = {
    async all() {
        return db.selectFrom('archivedFiles').selectAll().execute()
    },
    async findById(id) {
        return db.selectFrom('archivedFiles').selectAll().where('id', '=', id).executeTakeFirst()
    },
    async create(data) {
        return db.insertInto('archivedFiles').values(data).execute()
    },
    async update(id, data) {
        return db.updateTable('archivedFiles').set(data).where('id', '=', id).execute()
    },
    async remove(id) {
        return db.deleteFrom('archivedFiles').where('id', '=', id).execute()
    },
}
