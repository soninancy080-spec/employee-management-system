const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');

// Helper to compute calendar days duration
const getDurationDays = (start, end) => {
  const diffTime = Math.abs(new Date(end) - new Date(start));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * @openapi
 * /api/leaves:
 *   post:
 *     summary: Apply for a new leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum: [ANNUAL, SICK, CASUAL, MATERNITY, PATERNITY]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
 *       400:
 *         description: Validation error or insufficient balance
 */
router.post('/', auth, async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return res.status(400).json({ message: 'Start date cannot be after end date' });
  }

  const duration = getDurationDays(start, end);

  try {
    // 1. Find employee record linked to current user
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (!employee) {
      return res.status(400).json({ message: 'Only registered employees can apply for leaves.' });
    }

    // 2. Retrieve or initialize leave balance for this type
    let balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType: {
          employeeId: employee.id,
          leaveType,
        },
      },
    });

    if (!balance) {
      // Create default balance (e.g. 15 allocated days)
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveType,
          allocated: 15,
          used: 0,
        },
      });
    }

    const remaining = balance.allocated - balance.used;
    if (duration > remaining) {
      return res.status(400).json({ 
        message: `Insufficient leave balance. Requested: ${duration} days, Remaining: ${remaining} days.` 
      });
    }

    // 3. Create LeaveRequest, history record, and audit entry in transaction
    const request = await prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.create({
        data: {
          employeeId: employee.id,
          leaveType,
          startDate: start,
          endDate: end,
          reason,
          status: 'PENDING_MANAGER',
        },
      });

      await tx.leaveHistory.create({
        data: {
          leaveRequestId: leave.id,
          action: 'APPLIED',
          performedById: req.user.id,
          notes: `Applied for ${duration} days of ${leaveType} leave.`,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'LEAVE_APPLIED',
          entityName: 'LeaveRequest',
          entityId: leave.id,
          performedById: req.user.id,
          newValues: { leaveType, startDate: start, endDate: end, duration, reason }
        },
      });

      return leave;
    });

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error processing leave application' });
  }
});

/**
 * @openapi
 * /api/leaves/my:
 *   get:
 *     summary: Retrieve current employee's leaves and balances
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/my', auth, async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (!employee) {
      return res.status(400).json({ message: 'Employee profile not found' });
    }

    const [leaves, balances] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { employeeId: employee.id },
        include: {
          histories: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.leaveBalance.findMany({
        where: { employeeId: employee.id },
      }),
    ]);

    res.json({ leaves, balances });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * @openapi
 * /api/leaves/pending:
 *   get:
 *     summary: Get all pending leave requests requiring approval
 *     description: Managers see subordinate leaves. HR/Admin see all PENDING_HR leaves.
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending leave requests
 */
router.get('/pending', auth, async (req, res) => {
  try {
    const role = req.user.role;
    let pendingLeaves = [];

    if (role === 'ADMIN' || role === 'HR') {
      // HR/Admin see requests waiting for final HR approval
      pendingLeaves = await prisma.leaveRequest.findMany({
        where: {
          status: 'PENDING_HR',
        },
        include: {
          employee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    // Managers see requests from subordinates waiting for Manager approval
    if (role === 'MANAGER' || role === 'ADMIN') {
      const managerEmployee = await prisma.employee.findUnique({
        where: { userId: req.user.id },
      });

      if (managerEmployee) {
        const subordinatesLeaves = await prisma.leaveRequest.findMany({
          where: {
            status: 'PENDING_MANAGER',
            employee: {
              managerId: managerEmployee.id,
            },
          },
          include: {
            employee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });
        
        // Combine if user is both Admin and has subordinates
        pendingLeaves = [...pendingLeaves, ...subordinatesLeaves];
      }
    }

    res.json(pendingLeaves);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * @openapi
 * /api/leaves/{id}/approve-manager:
 *   post:
 *     summary: Manager tier approval or rejection
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval processed
 */
router.post('/:id/approve-manager', auth, checkRole(['MANAGER', 'ADMIN']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { action, notes } = req.body;

  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ message: 'Action must be APPROVE or REJECT' });
  }

  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'PENDING_MANAGER') {
      return res.status(400).json({ message: 'Leave request is not pending manager review' });
    }

    // Verify manager relationship
    const managerEmployee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (req.user.role !== 'ADMIN' && (!managerEmployee || leave.employee.managerId !== managerEmployee.id)) {
      return res.status(403).json({ message: 'Access denied: You are not this employee\'s manager' });
    }

    const nextStatus = action === 'APPROVE' ? 'PENDING_HR' : 'REJECTED';
    const historyAction = action === 'APPROVE' ? 'MANAGER_APPROVED' : 'MANAGER_REJECTED';

    const updated = await prisma.$transaction(async (tx) => {
      const updatedLeave = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          managerNotes: notes || null,
        },
      });

      await tx.leaveHistory.create({
        data: {
          leaveRequestId: id,
          action: historyAction,
          performedById: req.user.id,
          notes: notes || `Manager processed action: ${action}`,
        },
      });

      await tx.notification.create({
        data: {
          employeeId: leave.employeeId,
          title: `Leave Request Update`,
          message: `Your leave request has been ${action === 'APPROVE' ? 'approved' : 'rejected'} by your Manager. Current status: ${nextStatus}.`,
          type: 'LEAVE',
        },
      });

      await tx.auditLog.create({
        data: {
          action: `LEAVE_${historyAction}`,
          entityName: 'LeaveRequest',
          entityId: id,
          performedById: req.user.id,
          oldValues: { status: leave.status },
          newValues: { status: nextStatus, managerNotes: notes || null }
        },
      });

      return updatedLeave;
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * @openapi
 * /api/leaves/{id}/approve-hr:
 *   post:
 *     summary: HR tier final approval/rejection (deducts balances)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Final approval processed and balance updated
 */
router.post('/:id/approve-hr', auth, checkRole(['HR', 'ADMIN']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { action, notes } = req.body;

  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ message: 'Action must be APPROVE or REJECT' });
  }

  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'PENDING_HR') {
      return res.status(400).json({ message: 'Leave request is not pending HR approval' });
    }

    const nextStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const historyAction = action === 'APPROVE' ? 'HR_APPROVED' : 'HR_REJECTED';
    const duration = getDurationDays(leave.startDate, leave.endDate);

    const updated = await prisma.$transaction(async (tx) => {
      if (action === 'APPROVE') {
        // Find balance and ensure sufficiency
        let balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveType: {
              employeeId: leave.employeeId,
              leaveType: leave.leaveType,
            },
          },
        });

        if (!balance) {
          // If somehow balance record wasn't created, initialize it
          balance = await tx.leaveBalance.create({
            data: {
              employeeId: leave.employeeId,
              leaveType: leave.leaveType,
              allocated: 15,
              used: 0,
            },
          });
        }

        const remaining = balance.allocated - balance.used;
        if (duration > remaining) {
          throw new Error(`Insufficient leave balance. Required: ${duration} days, Remaining: ${remaining} days.`);
        }

        // Deduct balance
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: { increment: duration },
          },
        });
      }

      const updatedLeave = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          hrNotes: notes || null,
        },
      });

      await tx.leaveHistory.create({
        data: {
          leaveRequestId: id,
          action: historyAction,
          performedById: req.user.id,
          notes: notes || `HR processed final action: ${action}`,
        },
      });

      await tx.notification.create({
        data: {
          employeeId: leave.employeeId,
          title: `Leave Request Final Decision`,
          message: `Your leave request has been ${action === 'APPROVE' ? 'approved' : 'rejected'} by HR.`,
          type: 'LEAVE',
        },
      });

      await tx.auditLog.create({
        data: {
          action: `LEAVE_${historyAction}`,
          entityName: 'LeaveRequest',
          entityId: id,
          performedById: req.user.id,
          oldValues: { status: leave.status },
          newValues: { status: nextStatus, hrNotes: notes || null }
        },
      });

      return updatedLeave;
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || 'Error processing final approval' });
  }
});

module.exports = router;
