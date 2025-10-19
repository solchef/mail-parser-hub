import express from "express"
import { getAllFiles, previewCsvFile } from "../controllers/files.controller.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: Manage uploaded CSV/XLSX files
 */

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get all uploaded files
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: Returns list of files
 */
router.get("/", getAllFiles)

/**
 * @swagger
 * /files/{id}/preview:
 *   get:
 *     summary: Preview CSV file content
 *     tags: [Files]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns preview of file content
 */
router.get("/:id/preview", previewCsvFile)

export default router
