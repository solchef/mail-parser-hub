import { db } from '../config/connection.js'

export const TenantModel = {
    async all() {
        return db.selectFrom('tenants').selectAll().execute()
    },
    async findById(id) {
        return db.selectFrom('tenants').selectAll().where('id', '=', id).executeTakeFirst()
    },
    async create(data) {
        return db.insertInto('tenants').values(data).execute()
    },
    async update(id, data) {
        return db.updateTable('tenants').set(data).where('id', '=', id).execute()
    },
    async remove(id) {
        return db.deleteFrom('tenants').where('id', '=', id).execute()
    },
}
