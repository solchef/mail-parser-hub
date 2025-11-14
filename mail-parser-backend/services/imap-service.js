import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { FileModel } from "../models/file.model.js";
import { getImapConfig } from "../config/imap.js";
import { saveAttachment } from "../utils/save-attachment.js";

export async function processMailWithIMAP({ userEmail, password, uploadsBase = "./uploads" }) {
    const { imap } = getImapConfig(userEmail, password);

    // console.log(`[IMAP] Connecting to ${imap.host}:${imap.port} as ${imap.user}`);

    const connection = new ImapFlow({
        host: imap.host,
        port: imap.port,
        secure: imap.tls,
        auth: {
            user: imap.user,
            pass: imap.password,
        },
        logger: false,
        tls: {
            rejectUnauthorized: false,
        },

    });

    const processed = [];
    let connected = false;

    try {
        // 🔐 Attempt connection
        await connection.connect();
        connected = true;
        console.log(`[IMAP] Connected to ${imap.user}`);

        const lock = await connection.getMailboxLock("INBOX");

        try {
            const unseen = await connection.search({ seen: false });
            console.log(`[IMAP] Found ${unseen.length} unseen messages`);

            for (const uid of unseen) {
                const msg = await connection.fetchOne(uid, { source: true });
                const parsed = await simpleParser(msg.source);

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

                await connection.messageFlagsAdd(uid, ["\\Seen"]);
            }
        } finally {
            lock.release();
        }
    } catch (err) {
        console.error(`[IMAP] Error for ${imap.user}:`, err.message);
        if (err.code === "ECONNREFUSED") {
            console.error(`⚠️  IMAP server unreachable at ${imap.host}:${imap.port}`);
        } else if (err.code === "AUTHENTICATIONFAILED") {
            console.error(`⚠️  Invalid credentials for ${imap.user}`);
        } else {
            console.error(err);
        }
    } finally {
        // ❌ Only logout if we actually connected
        if (connected) {
            await connection.logout().catch(() => { });
            console.log(`[IMAP] Logged out ${imap.user}`);
        } else {
            console.log(`[IMAP] Skipped logout — never connected`);
        }
    }

    return processed;
}

