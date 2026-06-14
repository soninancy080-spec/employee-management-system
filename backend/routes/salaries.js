const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');
const salaryService = require('../services/salaryService');
const prisma = require('../db');

// @route   GET api/salaries/slip/:employeeId
// @desc    Get detailed salary slip for an employee (with slab math & prorated pay)
// @access  Private (Admin/HR/Manager or own employee)
router.get('/slip/:employeeId', auth, async (req, res, next) => {
  const { employeeId } = req.params;
  const { year, month } = req.query;

  // EMPLOYEE role can only see their own salary slip
  const emp = await prisma.employee.findUnique({ where: { id: parseInt(employeeId) } });
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee profile not found' });
  }
  if (req.user.role === 'EMPLOYEE' && emp.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied: unauthorized access to salary slip' });
  }

  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || (new Date().getMonth() + 1);

  try {
    const slip = await salaryService.getSalaryReport(employeeId, y, m);
    res.status(200).json({
      success: true,
      data: slip,
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/salaries/export
// @desc    Export month-end salary sheet for all employees
// @access  Private (Admin/HR only)
router.get('/export', auth, checkRole(['ADMIN', 'HR']), async (req, res, next) => {
  const { year, month } = req.query;
  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || (new Date().getMonth() + 1);

  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
    });

    const rows = [];
    for (const emp of employees) {
      try {
        const slip = await salaryService.getSalaryReport(emp.id, y, m);
        rows.push({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          semester: emp.semester || 'N/A',
          city: emp.city || 'N/A',
          domain: emp.domain || 'N/A',
          trackingMode: emp.trackingMode,
          baseGross: slip.employee.baseGross,
          monthGross: slip.payroll.gross,
          present: slip.attendance.present,
          absent: slip.attendance.absent,
          late: slip.attendance.late,
          penaltyAbsents: slip.attendance.penaltyAbsents,
          netPayableDays: slip.attendance.netPayableDays,
          basic: slip.payroll.basic,
          pf: slip.payroll.pf,
          esic: slip.payroll.esic,
          tds: slip.payroll.tds,
          totalDeductions: slip.payroll.totalDeductions,
          netPay: slip.payroll.netPay,
          employerPf: slip.payroll.employerContributions.pf,
          employerEsic: slip.payroll.employerContributions.esic,
          ctc: slip.payroll.ctc,
        });
      } catch (err) {
        // Log individual employee report failures and skip or use defaults
        console.error(`Error calculating salary report for employee ID ${emp.id}:`, err);
      }
    }

    const headers = [
      { key: 'id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'semester', label: 'Semester' },
      { key: 'city', label: 'City' },
      { key: 'domain', label: 'Domain' },
      { key: 'trackingMode', label: 'Tracking Mode' },
      { key: 'baseGross', label: 'Base Gross (₹)' },
      { key: 'monthGross', label: 'Month Gross (₹)' },
      { key: 'present', label: 'Present Days' },
      { key: 'absent', label: 'Absent Days' },
      { key: 'late', label: 'Late Count' },
      { key: 'penaltyAbsents', label: 'Late Penalty Days' },
      { key: 'netPayableDays', label: 'Net Payable Days' },
      { key: 'basic', label: 'Basic Salary (₹)' },
      { key: 'pf', label: 'PF Employee (₹)' },
      { key: 'esic', label: 'ESIC Employee (₹)' },
      { key: 'tds', label: 'TDS (₹)' },
      { key: 'totalDeductions', label: 'Total Deductions (₹)' },
      { key: 'netPay', label: 'Net Payable Salary (₹)' },
      { key: 'employerPf', label: 'PF Employer (₹)' },
      { key: 'employerEsic', label: 'ESIC Employer (₹)' },
      { key: 'ctc', label: 'CTC (₹)' },
    ];

    const convertToCSV = (data, headersList) => {
      const headerLine = headersList.map(h => `"${h.label}"`).join(',');
      const rowLines = data.map(row => {
        return headersList.map(h => {
          let val = row[h.key];
          if (val === null || val === undefined) {
            val = '';
          } else {
            val = typeof val === 'number' ? val.toFixed(2) : String(val).replace(/"/g, '""');
          }
          return `"${val}"`;
        }).join(',');
      });
      return [headerLine, ...rowLines].join('\n');
    };

    const csvContent = convertToCSV(rows, headers);
    const filename = `salary_sheet_${y}_${String(m).padStart(2, '0')}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

// @route   POST api/v1/salaries/run
// @desc    Run payroll for a selected month/year, create audit logs, and notify employees
// @access  Private (Admin/HR only)
router.post('/run', auth, checkRole(['ADMIN', 'HR']), async (req, res, next) => {
  const { year, month } = req.body;
  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || (new Date().getMonth() + 1);

  try {
    const employees = await prisma.employee.findMany();
    
    await prisma.auditLog.create({
      data: {
        action: 'RUN_PAYROLL',
        entityName: 'Payroll',
        entityId: y * 100 + m,
        performedById: req.user.id,
        newValues: { year: y, month: m, totalEmployeesProcessed: employees.length }
      }
    });

    const monthName = new Date(y, m - 1).toLocaleString('default', { month: 'long' });
    const notificationsData = employees.map(emp => ({
      employeeId: emp.id,
      title: 'Payroll Processed',
      message: `Payroll for ${monthName} ${y} has been successfully processed. You can now check your salary statement.`,
      type: 'GENERAL',
      isRead: false
    }));

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData
      });
    }

    res.status(200).json({
      success: true,
      message: `Payroll for ${monthName} ${y} has been successfully run. All employees have been notified.`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
