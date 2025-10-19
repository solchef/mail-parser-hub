import knex from 'knex'

export function createDBConnection(dbConfig) {
    if (!dbConfig?.type) throw new Error('Missing db type (mysql or mssql)')

    const client = dbConfig.type === 'mysql' ? 'mysql2' : 'mssql'
    return knex({
        client,
        connection: {
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database,
            options: client === 'mssql' ? { trustServerCertificate: true } : undefined
        },
        pool: { min: 0, max: 5 }
    })
}
