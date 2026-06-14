const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');

// @route   GET api/departments
// @desc    Get all departments (authenticated users)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/departments
// @desc    Create a department (Admin Only)
// @access  Private/Admin
router.post('/', auth, checkRole(['ADMIN']), async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    const existing = await prisma.department.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = await prisma.department.create({
      data: { name, description },
    });

    res.status(201).json(department);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/departments/:id
// @desc    Update a department (Admin Only)
// @access  Private/Admin
router.put('/:id', auth, checkRole(['ADMIN']), async (req, res) => {
  const { name, description } = req.body;
  const id = parseInt(req.params.id);

  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    const department = await prisma.department.update({
      where: { id },
      data: { name, description },
    });

    res.json(department);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/departments/:id
// @desc    Delete a department (Admin Only)
// @access  Private/Admin
router.delete('/:id', auth, checkRole(['ADMIN']), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.department.delete({
      where: { id },
    });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
