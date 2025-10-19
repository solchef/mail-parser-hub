import express from "express"
import * as inboxCtrl from "../controllers/inboxes.controller.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Inboxes
 *   description: Manage inboxes and Gmail connections
 */

/**
 * @swagger
 * /inboxes:
 *   get:
 *     summary: Get all inboxes
 *     tags: [Inboxes]
 *     responses:
 *       200:
 *         description: List of inboxes
 */
router.get("/", inboxCtrl.getAllInboxes)

/**
 * @swagger
 * /inboxes/{id}:
 *   get:
 *     summary: Get inbox by ID
 *     tags: [Inboxes]
 */
router.get("/:id", inboxCtrl.getInboxById)

/**
 * @swagger
 * /inboxes:
 *   post:
 *     summary: Create new inbox
 *     tags: [Inboxes]
 */
router.post("/", inboxCtrl.createInbox)

/**
 * @swagger
 * /inboxes/{id}:
 *   put:
 *     summary: Update inbox details
 *     tags: [Inboxes]
 */
router.put("/:id", inboxCtrl.updateInbox)

/**
 * @swagger
 * /inboxes/{id}:
 *   delete:
 *     summary: Delete an inbox
 *     tags: [Inboxes]
 */
router.delete("/:id", inboxCtrl.deleteInbox)

/**
 * @swagger
 * /inboxes/{id}/analytics:
 *   get:
 *     summary: Get inbox analytics
 *     tags: [Inboxes]
 */
router.get("/:id/analytics", inboxCtrl.getInboxAnalytics)

/**
 * @swagger
 * /inboxes/{id}/gmail-config:
 *   get:
 *     summary: Get Gmail configuration for an inbox
 *     tags: [Inboxes]
 */
// router.get("/:id/gmail-config", inboxCtrl.getInboxGmailConfig)

/**
 * @swagger
 * /inboxes/{id}/gmail-config:
 *   put:
 *     summary: Update Gmail configuration
 *     tags: [Inboxes]
 */
// router.put("/:id/gmail-config", inboxCtrl.updateInboxGmailConfig)

/**
 * @swagger
 * /inboxes/{id}/gmail-config/test:
 *   post:
 *     summary: Test Gmail connection
 *     tags: [Inboxes]
 */
// router.post("/:id/gmail-config/test", inboxCtrl.testGmailConnection)

export default router
