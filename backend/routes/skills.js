const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');

// @route   GET api/skills
// @desc    Get all skills
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    res.json(skills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/skills
// @desc    Create a skill (authenticated users)
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Skill name is required' });
  }

  try {
    const existing = await prisma.skill.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    const skill = await prisma.skill.create({
      data: { name: name.trim() },
    });

    res.status(201).json(skill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/skills/:id
// @desc    Delete a skill (Admin Only)
// @access  Private/Admin
router.delete('/:id', auth, checkRole(['ADMIN']), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.skill.delete({
      where: { id },
    });
    res.json({ message: 'Skill deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
