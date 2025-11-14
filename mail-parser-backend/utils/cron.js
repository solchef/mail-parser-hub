import nodeCron from "node-cron"
import fs from "fs"
import { parse } from "csv-parse/sync"
import { processMailWithGmail } from "../services/gmail-service.js"
import { processMailWithIMAP } from "../services/imap-service.js"
import { processImport } from "../controllers/imports.controller.js"
import { MailboxModel } from "../models/mailbox.model.js"
import { FileModel } from "../models/file.model.js"
import { MappingModel } from "../models/mapping.model.js"
import { getAttachment } from "./get-attachment.js"

const POLL_SECONDS = Number(process.env.POLL_INTERVAL_SECONDS || 20)
const IMPORT_SECONDS = Number(process.env.IMPORT_INTERVAL_SECONDS || 30)

export const startMailPolling = async () => {
    console.log(`[CRON] Mail polling every ${POLL_SECONDS}s`)
    console.log(`[CRON] Import processor every ${IMPORT_SECONDS}s`)

    // 🕒 1️⃣ Poll IMAP mailboxes
    if (POLL_SECONDS >= 60) {
        const cronExpr = `*/${Math.max(1, Math.floor(POLL_SECONDS / 60))} * * * *`
        nodeCron.schedule(cronExpr, pollMailboxes)
    } else {
        setInterval(pollMailboxes, Math.max(5000, POLL_SECONDS * 1000))
    }

    // 🕒 2️⃣ Process pending imports
    if (IMPORT_SECONDS >= 60) {
        const cronExpr = `*/${Math.max(1, Math.floor(IMPORT_SECONDS / 60))} * * * *`
        nodeCron.schedule(cronExpr, processPendingImports)
    } else {
        setInterval(processPendingImports, Math.max(5000, IMPORT_SECONDS * 1000))
    }
}

/* ---------------------------------------------
 * 1️⃣ MAILBOX POLLER
 * ------------------------------------------- */
async function pollMailboxes() {
    try {
        const mailboxes = await MailboxModel.all()

        for (const mb of mailboxes) {
            if (mb.status !== "active") continue
            console.log(`[CRON] Checking mailbox: ${mb.email}`)

            try {
                let processedFiles = []
                if (mb.type === "gmail") {
                    processedFiles = await processMailWithGmail(mb.email, mb.uploadsBase)
                } else {
                    processedFiles = await processMailWithIMAP({
                        userEmail: mb.imapConfig.user,
                        password: mb.imapConfig.password,
                        uploadsBase: mb.uploadsBase,
                    })
                }

                if (processedFiles.length) {
                    console.log(`[CRON] Saved ${processedFiles.length} attachments for ${mb.email}`)
                }
            } catch (err) {
                console.log(err)
                console.error(`[CRON] Error for mailbox ${mb.email}:`, err.message)
            }
        }

    } catch (err) {
        console.error("[CRON] Polling loop error:", err)
    }
}
/* ---------------------------------------------
 * 2️⃣ PENDING FILE IMPORT PROCESSOR
 * ------------------------------------------- */
async function processPendingImports() {
    try {
        const files = await FileModel.all()
        const pendingFiles = files.filter(f => f.status === "pending")

        if (!pendingFiles.length) {
            return
        }

        // 
        for (const file of pendingFiles) {
            try {
                // Use getAttachment to handle local or Drive file transparently
                const { filename, buffer } = await getAttachment({
                    driveFileId: file.driveFileId,
                    savedPath: file.savedPath,
                });

                // Write temp copy (optional) for mapping logic that needs a file path
                const tempPath = `./tmp/${filename}`;
                fs.mkdirSync("./tmp", { recursive: true });
                fs.writeFileSync(tempPath, buffer);

                const mapping = await findMappingForFile(tempPath);
                if (mapping) {
                    await processImportDirect(file.id, mapping.id, mapping.options);
                } else {
                    console.log(`[IMPORTER] No matching mapping found for ${filename}`);
                }

                fs.unlinkSync(tempPath); // cleanup
            } catch (err) {
                console.error(`[IMPORTER] Failed to load file ${file.id}:`, err.message);
            }
        }

    } catch (err) {
        console.error("[IMPORTER] Error processing pending files:", err)
    }
}

/* ---------------------------------------------
 *  🧩 FILE → MAPPING MATCHER
 * ------------------------------------------- */
function normalizeHeader(header) {
    return header.toLowerCase().replace(/[\s_]+/g, "")
}

export async function findMappingForFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            console.log("file found")
        }

        const csvText = fs.readFileSync(filePath, "utf8")
        const records = parse(csvText, { columns: true, skip_empty_lines: true })
        if (!records.length) return null

        const headers = Object.keys(records[0])
        const normalizedHeaders = headers.map(normalizeHeader)

        const mappings = await MappingModel.all()
        // const THRESHOLD = 1.0

        // console.log("[MAPPING] Found headers:", headers)

        for (const mapping of mappings) {
            const mappingHeaders = Object.keys(mapping.mapping || {})
            const normalizedMappingHeaders = mappingHeaders.map(normalizeHeader)

            const matches = normalizedMappingHeaders.filter(h => normalizedHeaders.includes(h))
            const ratio = matches.length / mappingHeaders.length

            console.log(`[MAPPING] '${mapping.name}' match ratio: ${ratio.toFixed(2)} (${matches.length}/${mappingHeaders.length})`)

            // if (ratio >= THRESHOLD) {
            //     console.log(`[MAPPING] ✅ Matched mapping '${mapping.name}'`)
            //     return mapping
            // }
            // Require exact header match (both sides same normalized headers)
            const sameHeaders =
                normalizedMappingHeaders.length === normalizedHeaders.length &&
                normalizedMappingHeaders.every(h => normalizedHeaders.includes(h));

            if (sameHeaders) {
                console.log(`[MAPPING] ✅ Perfect match for '${mapping.name}'`);
                return mapping;
            }
        }

        console.log("[MAPPING] ❌ No matching mapping found")
        return null
    } catch (err) {
        console.error("[MAPPING] Error matching file:", err)
        return null
    }
}

/* ---------------------------------------------
 *  🧩 Import Trigger
 * ------------------------------------------- */
async function processImportDirect(fileId, mappingId, options) {
    const req = {
        body: { fileId, mappingId, truncate: false },
    }
    const res = {
        status: (code) => ({
            json: (data) => console.error(code, data),
        }),
        json: (data) => console.log("[IMPORTER] Result:"),
    }
    await processImport(req, res)
}
