import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { v4 as uuidv4 } from "uuid"
import { FileModel } from "../models/file.model.js"
import { ImportModel } from "../models/import.model.js"
import { getAttachment } from "../utils/get-attachment.js"

//  GET ALL FILES
export async function getAllFiles(req, res) {
    try {
        const files = await FileModel.all()
        res.json(files)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to fetch files" })
    }
}

//  GET ONE FILE BY ID
export async function getFileById(req, res) {
    try {
        const file = await FileModel.findById(req.params.id)
        if (!file) return res.status(404).json({ error: "File not found" })
        res.json(file)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to fetch file" })
    }
}

//  PREVIEW A CSV FILE

export async function previewCsvFile(req, res) {
    try {
        const file = await FileModel.findById(req.params.id);
        if (!file) return res.status(404).json({ error: "File not found" });

        // 🔹 Get attachment (works for local or GDrive)
        const { filename, buffer } = await getAttachment({
            driveFileId: file.driveFileId,
            savedPath: file.savedPath,
        });

        const content = buffer.toString("utf8");
        const records = parse(content, { skip_empty_lines: true });

        if (!records.length) {
            return res.status(400).json({ error: "CSV file is empty" });
        }

        const importData = await ImportModel.findByFile(req.params.id) || null;

        res.json({
            headers: records[0],
            rows: records,
            importData,
            filename,
        });
    } catch (err) {
        console.error("[PREVIEW CSV ERROR]", err);
        res.status(500).json({ error: err.message || "Failed to preview CSV file" });
    }
}


//  CREATE FILE RECORD
export async function createFile(req, res) {
    try {
        const { name, mailbox, savedPath, status, recordsImported } = req.body

        if (!name || !mailbox || !savedPath) {
            return res.status(400).json({ error: "Missing required fields" })
        }

        const newFile = await FileModel.create({
            id: uuidv4(),
            name,
            mailbox,
            savedPath,
            status: status || "pending",
            recordsImported: recordsImported || 0,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })

        res.status(201).json(newFile)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to create file" })
    }
}

//  UPDATE FILE
export async function updateFile(req, res) {
    try {
        const { id } = req.params

        const updated = await FileModel
            .patch(req.body)
            .where("id", id)
            .returning("*")

        if (!updated.length) return res.status(404).json({ error: "File not found" })
        res.json(updated[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to update file" })
    }
}

//  DELETE FILE
export async function deleteFile(req, res) {
    try {
        const { id } = req.params
        const file = await FileModel.findById(id)
        if (!file) return res.status(404).json({ error: "File not found" })

        // Delete record
        await FileModel.deleteById(id)

        // Delete actual file from disk if exists
        if (fs.existsSync(file.savedPath)) {
            fs.unlinkSync(file.savedPath)
        }

        res.json({ message: "File deleted successfully" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to delete file" })
    }
}

//  FILE ANALYTICS
export async function getFileAnalytics(req, res) {
    try {
        const files = await FileModel

        const totalFiles = files.length
        const processed = files.filter(f => f.status === "processed").length
        const failed = files.filter(f => f.status === "failed").length
        const pending = files.filter(f => f.status === "pending").length
        const totalRecords = files.reduce(
            (sum, f) => sum + (f.recordsImported || 0),
            0
        )

        res.json({
            totalFiles,
            processed,
            failed,
            pending,
            totalRecords,
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to fetch analytics" })
    }
}
