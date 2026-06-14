const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');

// @route   POST api/v1/evaluations
// @desc    Create a new performance evaluation review
// @access  Private (Admin/HR/Manager only)
router.post('/', auth, checkRole(['ADMIN', 'HR', 'MANAGER']), async (req, res, next) => {
  const { employeeId, rating, feedback } = req.body;

  if (!employeeId || rating === undefined || !feedback) {
    return res.status(400).json({ success: false, message: 'Please provide employeeId, rating, and feedback.' });
  }

  const ratingVal = parseInt(rating);
  if (ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  try {
    // Find caller's own employee record (evaluator)
    const evaluator = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!evaluator) {
      return res.status(404).json({ success: false, message: 'Evaluator employee record not found.' });
    }

    // Verify recipient employee exists
    const employeeExists = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) }
    });

    if (!employeeExists) {
      return res.status(404).json({ success: false, message: 'Recipient employee record not found.' });
    }

    const evaluation = await prisma.performanceEvaluation.create({
      data: {
        employeeId: parseInt(employeeId),
        evaluatorId: evaluator.id,
        rating: ratingVal,
        feedback: feedback.trim(),
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        evaluator: { select: { id: true, name: true, email: true } },
      }
    });

    res.status(201).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: evaluation
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/v1/evaluations/employee/:employeeId
// @desc    Get all evaluations for a specific employee
// @access  Private (Admin/HR/Manager or own employee)
router.get('/employee/:employeeId', auth, async (req, res, next) => {
  const { employeeId } = req.params;

  try {
    const emp = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) }
    });

    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    // Employees can only read their own reviews
    if (req.user.role === 'EMPLOYEE' && emp.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: unauthorized access to performance logs' });
    }

    const evaluations = await prisma.performanceEvaluation.findMany({
      where: { employeeId: parseInt(employeeId) },
      include: {
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        evaluationDate: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: evaluations
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE api/v1/evaluations/:id
// @desc    Delete an evaluation record
// @access  Private (Admin only)
router.delete('/:id', auth, checkRole(['ADMIN']), async (req, res, next) => {
  const { id } = req.params;

  try {
    const evaluation = await prisma.performanceEvaluation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation record not found.' });
    }

    await prisma.performanceEvaluation.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation record deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
