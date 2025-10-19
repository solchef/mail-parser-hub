import express from 'express'
import * as mappingCtrl from '../controllers/mappings.controller.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Mappings
 *   description: Manage field mappings for data import
 */

/**
 * @swagger
 * /mappings:
 *   get:
 *     summary: List all mappings
 *     tags: [Mappings]
 *     responses:
 *       200:
 *         description: Returns a list of mappings
 */
router.get('/', mappingCtrl.listMappings)

/**
 * @swagger
 * /mappings:
 *   post:
 *     summary: Create or update a mapping
 *     tags: [Mappings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Mapping created or updated successfully
 */
router.post('/', mappingCtrl.saveMapping)

/**
 * @swagger
 * /mappings/{id}:
 *   delete:
 *     summary: Delete a mapping
 *     tags: [Mappings]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mapping deleted successfully
 */
router.delete('/:id', mappingCtrl.deleteMapping)

export default router
