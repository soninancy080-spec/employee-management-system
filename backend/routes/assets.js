const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { validateAsset } = require('../validation/assetValidation');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');

/**
 * @openapi
 * /api/assets:
 *   get:
 *     summary: Retrieve assets registry (Admin/HR/Employee)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
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
 *         description: List of assets
 */
router.get('/', auth, assetController.getAssets);

/**
 * @openapi
 * /api/assets/allocations/my:
 *   get:
 *     summary: Retrieve current employee's allocated assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of current allocations
 */
router.get('/allocations/my', auth, assetController.getMyAllocations);

/**
 * @openapi
 * /api/assets/allocations/all:
 *   get:
 *     summary: Retrieve all allocations (Admin/HR only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all allocations
 */
router.get('/allocations/all', auth, checkRole(['ADMIN', 'HR']), assetController.getAllAllocations);

/**
 * @openapi
 * /api/assets/{id}:
 *   get:
 *     summary: Retrieve specific asset details
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asset details
 */
router.get('/:id', auth, assetController.getAssetById);

/**
 * @openapi
 * /api/assets:
 *   post:
 *     summary: Create a new asset (Admin only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - serialNumber
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [LAPTOP, MONITOR, IDCARD]
 *     responses:
 *       201:
 *         description: Asset created
 */
router.post('/', auth, checkRole(['ADMIN']), validateAsset, assetController.createAsset);

/**
 * @openapi
 * /api/assets/{id}:
 *   put:
 *     summary: Update an asset (Admin only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Asset updated
 */
router.put('/:id', auth, checkRole(['ADMIN']), assetController.updateAsset);

/**
 * @openapi
 * /api/assets/{id}:
 *   delete:
 *     summary: Delete an asset (Admin only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asset deleted
 */
router.delete('/:id', auth, checkRole(['ADMIN']), assetController.deleteAsset);

/**
 * @openapi
 * /api/assets/{id}/allocate:
 *   post:
 *     summary: Allocate asset to employee (Admin only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset allocated
 */
router.post('/:id/allocate', auth, checkRole(['ADMIN']), assetController.allocate);

/**
 * @openapi
 * /api/assets/{id}/return:
 *   post:
 *     summary: Approve asset return (Admin only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset returned
 */
router.post('/:id/return', auth, checkRole(['ADMIN']), assetController.returnAsset);

module.exports = router;
