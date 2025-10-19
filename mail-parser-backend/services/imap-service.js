import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { FileModel } from "../models/file.model.js";
import { getImapConfig } from "../config/imap.js";
import { saveAttachment } from "../utils/save-attachment.js";

export async function processMailWithIMAP({ userEmail, password, uploadsBase = "./uploads" }) {
    const { imap } = getImapConfig(userEmail, password);

    // Create connection (like imaps.connect)
    const connection = new ImapFlow({
        host: imap.host,
        port: imap.port,
        secure: imap.tls,
        auth: {
            user: imap.user,
            pass: imap.password,
        },
        logger: false,
    });

    const processed = [];

    try {
        await connection.connect();
        const lock = await connection.getMailboxLock("INBOX");

        try {
            // Similar to imaps.search([['UNSEEN']], ...)
            const unseen = await connection.search({ seen: false });

            for (const uid of unseen) {
                const msg = await connection.fetchOne(uid, { source: true });
                const parsed = await simpleParser(msg.source);

                // Same attachment loop
                for (const att of parsed.attachments || []) {
                    const filename = att.filename || `attachment-${Date.now()}`;
                    if (/\.(png|jpe?g|gif)$/i.test(filename)) continue;

                    const isCsv = /\.csv$/i.test(filename);
                    const record = await saveAttachment({
                        userEmail,
                        uploadsBase,
                        filename,
                        buffer: att.content,
                        isCsv,
                    });

                    await FileModel.create(record);
                    processed.push(record);
                }

                // Equivalent to connection.addFlags(uid, ["\\Seen"])
                await connection.messageFlagsAdd(uid, ["\\Seen"]);
            }
        } finally {
            lock.release();
        }
    } finally {
        await connection.logout();
    }

    return processed;
}
