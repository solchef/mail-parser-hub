/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // tenants
    await knex.schema.createTable('tenants', (table) => {
        table.string('id', 255).primary();
        table.string('name', 255);
        table.datetime('createdAt');
    });

    // users
    await knex.schema.createTable('users', (table) => {
        table.string('id', 255).primary();
        table.string('name', 255);
        table.string('email', 255);
        table.string('password', 255);
        table.string('role', 50);
        table.string('status', 50);
    });

    // mailboxes
    await knex.schema.createTable('mailboxes', (table) => {
        table.string('id', 255).primary();
        table.string('tenantId', 255);
        table.string('name', 255);
        table.string('email', 255);
        table.string('status', 50);
        table.datetime('createdAt');
        table.boolean('gmailConfigured');
        table.text('gmailClientId');
        table.text('gmailClientSecret');
        table.text('gmailRefreshToken');
        table.text('gmailRedirectUri');
        table.text('uploadsBase');
    });

    // dbConnections
    await knex.schema.createTable('dbConnections', (table) => {
        table.string('id', 255).primary();
        table.string('name', 255);
        table.string('type', 50);
        table.string('host', 255);
        table.string('port', 50);
        table.string('database', 255);
        table.string('user', 255);
        table.text('password');
        table.datetime('createdAt');
    });

    // files
    await knex.schema.createTable('files', (table) => {
        table.string('id', 255).primary();
        table.string('mailbox', 255);
        table.string('filename', 255);
        table.string('originalFilename', 255);
        table.string('status', 50);
        table.string('subject', 255);
        table.string('fromAddress', 255);
        table.datetime('date');
        table.text('savedPath');
        table.integer('recordsImported');
        table.datetime('createdAt');
    });

    // mappings
    await knex.schema.createTable('mappings', (table) => {
        table.string('id', 255).primary();
        table.string('name', 255);
        table.string('fileId', 255);
        table.string('connectionId', 255);
        table.string('table', 255);
        table.json('mapping');
        table.json('options');
        table.datetime('createdAt');
    });

    // imports
    await knex.schema.createTable('imports', (table) => {
        table.string('id', 255).primary();
        table.string('fileId', 255);
        table.string('filename', 255);
        table.string('mappingId', 255);
        table.string('status', 50);
        table.datetime('importedAt');
        table.integer('recordsImported');
        table.json('errors');
    });

    // archivedFiles
    await knex.schema.createTable('archivedFiles', (table) => {
        table.string('id', 255).primary();
        table.string('originalFileId', 255);
        table.datetime('archivedAt');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('archivedFiles');
    await knex.schema.dropTableIfExists('imports');
    await knex.schema.dropTableIfExists('mappings');
    await knex.schema.dropTableIfExists('files');
    await knex.schema.dropTableIfExists('dbConnections');
    await knex.schema.dropTableIfExists('mailboxes');
    await knex.schema.dropTableIfExists('users');
    await knex.schema.dropTableIfExists('tenants');
};
