const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');

/**
 * @openapi
 * /api/audit:
 *   get:
 *     summary: Retrieve system-wide audit logs (HR/Admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of audit log entries
 *       403:
 *         description: Forbidden - Role unauthorized
 */
router.get('/', auth, checkRole(['HR', 'ADMIN']), auditController.getAuditLogs);

module.exports = router;
