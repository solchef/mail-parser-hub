import express from "express"
import { processImport, listImports, saveMappingAndImport, retryImport } from "../controllers/imports.controller.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Imports
 *   description: Manage CSV/XLSX import operations
 */

/**
 * @swagger
 * /imports:
 *   get:
 *     summary: List all import operations
 *     tags: [Imports]
 *     responses:
 *       200:
 *         description: Returns list of imports
 */
router.get('/', listImports)

/**
 * @swagger
 * /imports/process:
 *   post:
 *     summary: Process an import manually
 *     tags: [Imports]
 *     responses:
 *       200:
 *         description: Import process started
 */
router.post("/process", processImport)

/**
 * @swagger
 * /imports/save-mapping-and-import:
 *   post:
 *     summary: Save mapping and start import
 *     tags: [Imports]
 *     responses:
 *       200:
 *         description: Mapping saved and import started
 */
router.post("/save-mapping-and-import", saveMappingAndImport)

router.get("/:id/retry", retryImport)

export default router
