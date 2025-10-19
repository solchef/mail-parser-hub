// utils/saveAttachment.js
import { v4 as uuidv4 } from "uuid";
import { saveLocalFile, saveDriveFile } from "../services/file-storage.js";

export async function saveAttachment({
    userEmail,
    uploadsBase = "./uploads",
    filename,
    buffer,
    isCsv = false,
}) {
    const recordCount = isCsv ? buffer.toString("utf8").trim().split(/\r?\n/).length - 1 : 0;
    const storageType = process.env.STORAGE_LOCATION || "local";

    let saved = {};
    if (storageType === "gdrive") {
        saved = await saveDriveFile(userEmail, filename, buffer, isCsv);
    } else {
        saved = await saveLocalFile(userEmail, uploadsBase, filename, buffer, isCsv);
    }

    return {
        id: uuidv4(),
        mailbox: userEmail,
        filename: saved.savedName,
        originalFilename: filename,
        status: isCsv ? "pending" : "bad",
        savedPath: saved.savePath || null,
        driveFileId: saved.driveFileId || null,
        webViewLink: saved.webViewLink || null,
        webContentLink: saved.webContentLink || null,
        recordsImported: recordCount,
        createdAt: new Date(),
    };
}
