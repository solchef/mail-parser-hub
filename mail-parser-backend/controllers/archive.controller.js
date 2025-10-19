import path from 'path'
import fs from 'fs'
import { ArchivedFileModel } from '../models/archiveImport.model.js'  // assumes you have this model defined

const ARCHIVE_DIR = path.join(process.cwd(), 'storage', 'archives')

// List all archived files
export const listArchivedFiles = async (req, res) => {
    try {
        const archived = await ArchivedFileModel.findAll()
        res.json(archived)
    } catch (err) {
        console.error('[ARCHIVE] Error listing files:', err)
        res.status(500).json({ error: 'Failed to list archived files' })
    }
}

// Download a file
export const downloadArchivedFile = async (req, res) => {
    const { id } = req.params

    try {
        const file = await ArchivedFileModel.findByPk(id)
        if (!file) return res.status(404).json({ error: 'File not found' })

        const filePath = path.join(ARCHIVE_DIR, file.filename)
        if (!fs.existsSync(filePath))
            return res.status(404).json({ error: 'File missing on disk' })

        res.download(filePath)
    } catch (err) {
        console.error('[ARCHIVE] Error downloading file:', err)
        res.status(500).json({ error: 'Failed to download file' })
    }
}
