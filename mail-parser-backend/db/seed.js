import { db } from '../config/connection.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { ImportModel } from '../models/import.model.js'
import { MappingModel } from '../models/mapping.model.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const seedFilePath = path.join(__dirname, './data.json')

// Helper: Convert ISO date → "YYYY-MM-DD HH:MM:SS"
function toMySQLDate(value) {
    if (!value) return null
    try {
        const d = new Date(value)
        if (isNaN(d.getTime())) return value
        return d.toISOString().slice(0, 19).replace('T', ' ')
    } catch {
        return value
    }
}

const validColumns = {
    tenants: ['id', 'name', 'createdAt'],
    users: ['id', 'name', 'email', 'password', 'role', 'status'],
    mailboxes: [
        'id', 'tenantId', 'name', 'email', 'status',
        'createdAt', 'gmailConfigured', 'gmailClientId',
        'gmailClientSecret', 'gmailRefreshToken', 'gmailRedirectUri', 'uploadsBase',
    ],
    dbConnections: [
        'id', 'name', 'type', 'host', 'port', 'database',
        'user', 'password', 'createdAt',
    ],
    files: [
        'id', 'mailbox', 'filename', 'originalFilename', 'status',
        'subject', 'fromAddress', 'date', 'savedPath',
        'recordsImported', 'createdAt',
    ],
    mappings: [
        'id', 'name', 'fileId', 'connectionId', 'table',
        'mapping', 'options', 'createdAt',
    ],
    imports: [
        'id', 'fileId', 'filename', 'mappingId', 'status',
        'importedAt', 'recordsImported', 'errors',
    ],
    archivedFiles: ['id', 'originalFileId', 'archivedAt'],
}

const order = [
    'tenants',
    'users',
    'mailboxes',
    'dbConnections',
    'files',
    'mappings',
    'imports',
    'archivedFiles',
]

async function clearTables() {
    console.log('🧹 Clearing existing data...')
    for (const table of [...order].reverse()) {
        try {
            await db.deleteFrom(table).execute()
            console.log(`🗑️ Cleared ${table}`)
        } catch (err) {
            console.warn(`⚠️ Skipped clearing ${table}:`, err.message)
        }
    }
    console.log('✅ Tables cleared\n')
}

async function seed() {
    console.log('🌱 Starting database seeding...')

    try {
        const rawData = await fs.readFile(seedFilePath, 'utf-8')
        const seedData = JSON.parse(rawData)

        await clearTables()

        for (const table of order) {
            const records = seedData[table]
            if (!records?.length) continue

            console.log(`➡️ Seeding ${table}...`)

            for (const record of records) {
                try {
                    // Normalize all date/datetime fields
                    for (const key of Object.keys(record)) {
                        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
                            record[key] = toMySQLDate(record[key])
                        }
                    }

                    if (table === 'mappings') {
                        await MappingModel.create(record)
                    } else if (table === 'imports') {
                        await ImportModel.create(record)
                    } else {
                        const allowed = validColumns[table]
                        const filtered = {}
                        for (const key of allowed) {
                            if (record[key] !== undefined) filtered[key] = record[key]
                        }
                        await db.insertInto(table).values(filtered).execute()
                    }
                } catch (err) {
                    console.warn(`⚠️ Skipped record in ${table}:`, err.message)
                }
            }

            console.log(`✅ Done seeding ${table}`)
        }

        console.log('\n🎉 Seeding complete (with skips if errors occurred)')
    } catch (err) {
        console.error('❌ Fatal seed error:', err)
    } finally {
        process.exit(0)
    }
}

seed()
