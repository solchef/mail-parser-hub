import { db } from '../config/connection.js'

export const FileModel = {
    async all() {
        return db.selectFrom('files').selectAll().execute()
    },
    async findById(id) {
        return db.selectFrom('files').selectAll().where('id', '=', id).executeTakeFirst()
    },
    async findBy(param, value) {
        return db.selectFrom('files').selectAll().where(param, '=', value).execute()
    },
    async create(data) {
        return db.insertInto('files').values(data).execute()
    },
    async update(id, data) {
        return db.updateTable('files').set(data).where('id', '=', id).execute()
    },
    async remove(id) {
        return db.deleteFrom('files').where('id', '=', id).execute()
    },
}
