import { FileModel } from "../models/file.model.js";
import { getGmailAuth, getGmailClient } from "../config/gmail.js";
import { saveAttachment } from "../utils/save-attachment.js";

export async function processMailWithGmail(userEmail, uploadsBase = "./uploads") {
    const scopes = (process.env.GOOGLE_SCOPES || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    console.log(userEmail)

    const auth = getGmailAuth(userEmail, scopes);

    await auth.authorize();
    const gmail = getGmailClient(auth);

    const { data } = await gmail.users.messages.list({
        userId: "me",
        q: "is:unread has:attachment",
        maxResults: 50,
    });

    const messages = data.messages || [];
    if (!messages.length) return [];

    const processedFiles = [];

    for (const { id } of messages) {
        const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
        const attachments = extractAttachments(msg.data);

        for (const att of attachments) {
            const attachRes = await gmail.users.messages.attachments.get({
                userId: "me",
                messageId: id,
                id: att.id,
            });

            const buffer = Buffer.from(attachRes.data.data, "base64");
            const isCsv = /\.csv$/i.test(att.filename);
            const record = await saveAttachment({
                userEmail,
                uploadsBase,
                filename: att.filename,
                buffer,
                isCsv,
            });

            await FileModel.create(record);
            processedFiles.push(record);
        }

        await markAsProcessed(gmail, id);
    }

    return processedFiles;
}

function extractAttachments(message) {
    const parts = [];
    (function walk(part) {
        if (!part) return;
        if (part.parts) part.parts.forEach(walk);
        parts.push(part);
    })(message.payload);

    return parts
        .filter(p => p.filename && p.body?.attachmentId)
        .map(p => ({
            id: p.body.attachmentId,
            filename: p.filename,
            mimeType: p.mimeType,
        }));
}

async function markAsProcessed(gmail, messageId) {
    try {
        const labelName = "Processed";
        const { data } = await gmail.users.labels.list({ userId: "me" });
        const existing = data.labels.find(l => l.name === labelName);

        const labelId = existing
            ? existing.id
            : (await gmail.users.labels.create({
                userId: "me",
                requestBody: { name: labelName },
            })).data.id;

        await gmail.users.messages.modify({
            userId: "me",
            id: messageId,
            requestBody: {
                addLabelIds: [labelId],
                removeLabelIds: ["INBOX", "UNREAD"],
            },
        });
    } catch (err) {
        console.warn("⚠️ Failed to label Gmail message:", err.message);
    }
}
