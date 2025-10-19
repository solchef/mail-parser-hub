/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // Add new columns first
    await knex.schema.alterTable("mailboxes", (table) => {
        table.string("type", 50).defaultTo("imap");
        table.json("gmailConfig");
        table.json("imapConfig");
    });

    // Migrate old gmail config columns into the new gmailConfig JSON
    const rows = await knex("mailboxes").select(
        "id",
        "gmailConfigured",
        "gmailClientId",
        "gmailClientSecret",
        "gmailRefreshToken",
        "gmailRedirectUri"
    );

    for (const row of rows) {
        const gmailConfig = {
            configured: !!row.gmailConfigured,
            clientId: row.gmailClientId || null,
            clientSecret: row.gmailClientSecret || null,
            refreshToken: row.gmailRefreshToken || null,
            redirectUri: row.gmailRedirectUri || null,
        };

        await knex("mailboxes")
            .where({ id: row.id })
            .update({ gmailConfig: JSON.stringify(gmailConfig) });
    }

    // Drop old Gmail columns
    await knex.schema.alterTable("mailboxes", (table) => {
        table.dropColumn("gmailConfigured");
        table.dropColumn("gmailClientId");
        table.dropColumn("gmailClientSecret");
        table.dropColumn("gmailRefreshToken");
        table.dropColumn("gmailRedirectUri");
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    // Revert changes (optional)
    await knex.schema.alterTable("mailboxes", (table) => {
        table.dropColumn("type");
        table.dropColumn("gmailConfig");
        table.dropColumn("imapConfig");
        table.boolean("gmailConfigured");
        table.text("gmailClientId");
        table.text("gmailClientSecret");
        table.text("gmailRefreshToken");
        table.text("gmailRedirectUri");
    });
}
