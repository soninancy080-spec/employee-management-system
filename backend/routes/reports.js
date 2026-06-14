const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');

/**
 * @openapi
 * /api/reports/export:
 *   get:
 *     summary: Export data reports to CSV format (Admin/HR only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [employees, leaves, assets]
 *     responses:
 *       200:
 *         description: CSV file download stream
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', auth, checkRole(['ADMIN', 'HR']), reportController.exportReport);

module.exports = router;
