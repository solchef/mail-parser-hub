import express from "express"
import * as archiveCtrl from "../controllers/archive.controller.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Archives
 *   description: Access archived files
 */

/**
 * @swagger
 * /archives:
 *   get:
 *     summary: List all archived files
 *     tags: [Archives]
 */
router.get("/", archiveCtrl.listArchivedFiles)

/**
 * @swagger
 * /archives/{id}/download:
 *   get:
 *     summary: Download archived file by ID
 *     tags: [Archives]
 */
router.get("/:id/download", archiveCtrl.downloadArchivedFile)

export default router
