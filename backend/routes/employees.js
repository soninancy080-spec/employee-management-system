const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Multer multi-field configuration
const cpUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]);

/**
 * @openapi
 * /api/employees:
 *   get:
 *     summary: Retrieve employees with search, department filtering, pagination, and sorting
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: departmentId
 *         in: query
 *         schema:
 *           type: integer
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated employees list
 */
router.get('/', auth, employeeController.getEmployees);

/**
 * @openapi
 * /api/employees/profile/my:
 *   get:
 *     summary: Retrieve caller's own employee profile details
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/profile/my', auth, employeeController.getMyProfile);

/**
 * @openapi
 * /api/employees/{id}:
 *   get:
 *     summary: Retrieve employee by ID
 *     tags: [Employees]
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
 *         description: Employee details
 */
router.get('/:id', auth, employeeController.getEmployeeById);

/**
 * @openapi
 * /api/employees:
 *   post:
 *     summary: Create a new employee profile (Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               departmentId:
 *                 type: integer
 *               skills:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               resume:
 *                 type: string
 *                 format: binary
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
router.post('/', auth, checkRole(['ADMIN']), cpUpload, employeeController.createEmployee);

/**
 * @openapi
 * /api/employees/profile/my:
 *   put:
 *     summary: Update caller's own employee profile
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               resume:
 *                 type: string
 *                 format: binary
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile/my', auth, cpUpload, employeeController.updateMyProfile);

/**
 * @openapi
 * /api/employees/{id}:
 *   put:
 *     summary: Update an employee profile (Admin only)
 *     tags: [Employees]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Employee updated
 */
router.put('/:id', auth, checkRole(['ADMIN']), cpUpload, employeeController.updateEmployee);

/**
 * @openapi
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete an employee profile (Admin only)
 *     tags: [Employees]
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
 *         description: Employee deleted
 */
router.delete('/:id', auth, checkRole(['ADMIN']), employeeController.deleteEmployee);

module.exports = router;
