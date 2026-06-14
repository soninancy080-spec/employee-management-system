const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { attendanceSchema } = require('../validation/schemas');
const attendanceService = require('../services/attendanceService');

// @route   POST api/attendance
// @desc    Record/upsert attendance
// @access  Private (Admin/HR/Manager or own employee)
router.post('/', auth, validate(attendanceSchema), async (req, res, next) => {
  const { employeeId, date, status, lateReason } = req.body;
  try {
    if (req.user.role === 'EMPLOYEE') {
      const emp = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (!emp || emp.id !== parseInt(employeeId)) {
        return res.status(403).json({ success: false, message: 'Access denied: cannot record attendance for other employees' });
      }
    } else if (!['ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: unauthorized role' });
    }

    const record = await attendanceService.recordAttendance(employeeId, date, status, lateReason);
    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/attendance/summary/:employeeId
// @desc    Get monthly summary and penalty calculations
// @access  Private (Admin/HR/Manager or own employee)
router.get('/summary/:employeeId', auth, async (req, res, next) => {
  const { employeeId } = req.params;
  const { year, month } = req.query;

  // Normal employees can only view their own attendance summary
  const emp = await prisma.employee.findUnique({ where: { id: parseInt(employeeId) } });
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee profile not found' });
  }
  if (req.user.role === 'EMPLOYEE' && emp.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || (new Date().getMonth() + 1);

  try {
    const summary = await attendanceService.getAttendanceSummary(employeeId, y, m);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/attendance/report
// @desc    Get filtered employee attendance report (Semester, City, Domain, Tracking Mode)
// @access  Private (Admin/HR/Manager)
router.get('/report', auth, checkRole(['ADMIN', 'HR', 'MANAGER']), async (req, res, next) => {
  const { semester, city, domain, trackingMode } = req.query;
  try {
    const report = await attendanceService.getFilteredReport({
      semester,
      city,
      domain,
      trackingMode,
    });
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
