export async function up(knex) {
    const hasDriveFileId = await knex.schema.hasColumn('files', 'driveFileId');

    if (!hasDriveFileId) {
        await knex.schema.alterTable('files', (table) => {
            table.string('driveFileId', 255).nullable();
            table.text('webViewLink').nullable();
            table.text('webContentLink').nullable();
        });
    }
}

export async function down(knex) {
    const hasDriveFileId = await knex.schema.hasColumn('files', 'driveFileId');

    if (hasDriveFileId) {
        await knex.schema.alterTable('files', (table) => {
            table.dropColumn('driveFileId');
            table.dropColumn('webViewLink');
            table.dropColumn('webContentLink');
        });
    }
}
