import express from 'express'
import * as dbCtrl from '../controllers/dbConnections.controller.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Database Connections
 *   description: Manage external database connections
 */

/**
 * @swagger
 * /database:
 *   get:
 *     summary: List all saved database connections
 *     tags: [Database Connections]
 */
router.get('/', dbCtrl.listConnections)

/**
 * @swagger
 * /database:
 *   post:
 *     summary: Create new database connection
 *     tags: [Database Connections]
 */
router.post('/', dbCtrl.saveConnection)

/**
 * @swagger
 * /database/test:
 *   post:
 *     summary: Test database connection
 *     tags: [Database Connections]
 */
router.post('/test', dbCtrl.testConnection)

/**
 * @swagger
 * /database/tables:
 *   get:
 *     summary: List tables for a given connection
 *     tags: [Database Connections]
 */
router.get('/tables', dbCtrl.listTables)

/**
 * @swagger
 * /database/columns:
 *   get:
 *     summary: List columns for a table
 *     tags: [Database Connections]
 */
router.get('/columns', dbCtrl.listTableColumns)

/**
 * @swagger
 * /database/{id}:
 *   delete:
 *     summary: Delete a database connection
 *     tags: [Database Connections]
 */
router.delete('/:id', dbCtrl.deleteConnection)

/**
 * @swagger
 * /database:
 *   post:
 *     summary: analyze db schema based on csv rows
 *     tags: [Database Connections]
 */
router.post('/analyze-schema', dbCtrl.analyzeCSVSchema);


/**
 * @swagger
 * /database:
 *   post:
 *     summary: Create new table based on csv schema
 *     tags: [Database Connections]
 */
router.post('/create-table', dbCtrl.createTableFromSchema)


export default router
