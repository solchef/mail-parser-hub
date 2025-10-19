// utils/storage.js
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { getGmailAuth } from "../config/gmail.js";
import { PassThrough } from "stream";

let driveClient = null;

function getDriveClient() {
    if (driveClient) return driveClient;
    const scopes = ["https://www.googleapis.com/auth/drive.file"];
    const auth = getGmailAuth(process.env.GOOGLE_IMPERSONATE_EMAIL, scopes);

    driveClient = google.drive({ version: "v3", auth });
    // console.log(driveClie)
    return driveClient;
}

/**
 * Saves a file locally
 */
export async function saveLocalFile(userEmail, uploadsBase, filename, buffer, isCsv) {
    const tenantDir = path.join(uploadsBase, userEmail.replace(/[@.]/g, "_"));
    const incomingDir = path.join(tenantDir, "incoming");
    const badDir = path.join(tenantDir, "bad");

    for (const dir of [tenantDir, incomingDir, badDir]) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    const savedName = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;
    const savePath = path.join(isCsv ? incomingDir : badDir, savedName);
    fs.writeFileSync(savePath, buffer);

    return { savedName, savePath };
}

/**
 * Saves a file to Google Drive
 */

export async function saveDriveFile(userEmail, filename, buffer, isCsv) {
    const drive = getDriveClient();
    const baseFolder = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!baseFolder) {
        throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID in .env");
    }

    // 🔹 Create tenant folder → incoming/bad subfolder
    const folderName = userEmail.replace(/[@.]/g, "_");
    let folderId = await getOrCreateFolder(drive, folderName, baseFolder);
    const subFolderName = isCsv ? "incoming" : "bad";
    folderId = await getOrCreateFolder(drive, subFolderName, folderId);

    // 🔹 Prepare file data
    const savedName = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;
    const fileMeta = {
        name: savedName,
        parents: [folderId],
    };

    // ✅ Convert buffer into a proper readable stream for Drive upload
    const stream = new PassThrough();
    stream.end(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));

    const media = {
        mimeType: isCsv ? "text/csv" : "application/octet-stream",
        body: stream,
    };

    // 🔹 Upload to Drive
    const { data } = await drive.files.create({
        requestBody: fileMeta,
        media,
        fields: "id, name, webViewLink, webContentLink, parents",
    });

    console.log(`[Drive] Uploaded ${data.name} (${data.id}) to ${folderName}/${subFolderName}`);

    return {
        savedName,
        driveFileId: data.id,
        webViewLink: data.webViewLink,
        webContentLink: data.webContentLink,
    };
}

async function getOrCreateFolder(drive, folderName, parentId) {
    const { data } = await drive.files.list({
        q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: "files(id, name)",
    });

    if (data.files.length) return data.files[0].id;

    const fileMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
    };

    const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id",
    });

    return folder.data.id;
}
