import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { getGmailAuth } from "../config/gmail.js";

/**
 * Retrieve a file (locally or from Google Drive)
 * @param {Object} params
 * @param {string} params.driveFileId - The Google Drive file ID
 * @param {string} params.savedPath - The local file path (if applicable)
 * @returns {Promise<{ filename: string, buffer: Buffer }>}
 */
export async function getAttachment({ driveFileId, savedPath }) {
    const storageType = process.env.STORAGE_LOCATION || "local";

    if (storageType === "gdrive") {
        if (!driveFileId) throw new Error("Missing driveFileId for Drive storage");

        const drive = getDriveClient();
        const res = await drive.files.get(
            { fileId: driveFileId, alt: "media" },
            { responseType: "arraybuffer" }
        );

        const fileMeta = await drive.files.get({
            fileId: driveFileId,
            fields: "name",
        });

        return {
            filename: fileMeta.data.name,
            buffer: Buffer.from(res.data),
        };
    } else {
        if (!savedPath) throw new Error("Missing savedPath for local storage");

        if (!fs.existsSync(savedPath)) throw new Error(`File not found: ${savedPath}`);

        const filename = path.basename(savedPath);
        const buffer = fs.readFileSync(savedPath);
        return { filename, buffer };
    }
}

/**
 * Internal helper – get Drive client
 */
let driveClient = null;
function getDriveClient() {
    if (driveClient) return driveClient;
    const scopes = ["https://www.googleapis.com/auth/drive.readonly"];
    const auth = getGmailAuth(process.env.GOOGLE_IMPERSONATE_EMAIL, scopes);
    driveClient = google.drive({ version: "v3", auth });
    return driveClient;
}
