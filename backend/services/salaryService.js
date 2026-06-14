const prisma = require('../db');
const { AppError } = require('../middleware/errorHandler');

class SalaryService {
  calculateDeductions(gross) {
    const basic = gross * 0.50; // Basic is 50% of gross
    const pf = basic * 0.12;    // Employee PF is 12% of basic

    // ESIC is 0.75% of gross for employees earning up to ₹21,000 gross per month
    const esic = gross <= 21000 ? gross * 0.0075 : 0;

    // TDS Slab calculation
    let tdsRate = 0;
    if (gross > 25000 && gross <= 50000) {
      tdsRate = 0.05;
    } else if (gross > 50000 && gross <= 75000) {
      tdsRate = 0.10;
    } else if (gross > 75000 && gross <= 100000) {
      tdsRate = 0.15;
    } else if (gross > 100000 && gross <= 150000) {
      tdsRate = 0.20;
    } else if (gross > 150000) {
      tdsRate = 0.30;
    }

    const tds = gross * tdsRate;
    const totalDeductions = pf + esic + tds;
    const netPay = gross - totalDeductions;

    // Employer contributions for CTC
    const employerPf = basic * 0.12;
    const employerEsic = gross <= 21000 ? gross * 0.0325 : 0;
    const ctc = gross + employerPf + employerEsic;

    return {
      gross,
      basic,
      pf,
      esic,
      tds,
      tdsRate: tdsRate * 100,
      totalDeductions,
      netPay,
      employerContributions: {
        pf: employerPf,
        esic: employerEsic,
      },
      ctc,
    };
  }

  async getSalaryReport(employeeId, year, month) {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    });
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    // Start/End of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    // Fetch attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let present = 0;
    let absent = 0;
    let late = 0;
    const lateReasons = [];

    attendanceRecords.forEach((record) => {
      if (record.status === 'PRESENT') {
        present++;
      } else if (record.status === 'ABSENT') {
        absent++;
      } else if (record.status === 'LATE') {
        late++;
        if (record.lateReason) {
          lateReasons.push(record.lateReason);
        }
      }
    });

    const totalDays = attendanceRecords.length || 30; // fallback to 30 if no records
    
    // 3 Lates = 1 Absent penalty rule
    const penaltyAbsents = Math.floor(late / 3);
    const adjustedAbsents = absent + penaltyAbsents;
    const presentPayDays = present + late; // base payable days
    const netPayableDays = Math.max(0, presentPayDays - penaltyAbsents);

    // Calculate month-end pro-rated gross salary
    const baseGross = employee.grossSalary;
    const prorationRatio = totalDays > 0 ? netPayableDays / totalDays : 0;
    const prorationRatioFormatted = Math.min(1, prorationRatio);
    const monthGross = baseGross * prorationRatioFormatted;

    // Run deductions calculation
    const payroll = this.calculateDeductions(monthGross);

    return {
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        baseGross,
      },
      attendance: {
        totalDays,
        present,
        absent,
        late,
        penaltyAbsents,
        adjustedAbsents,
        netPayableDays,
        lateReasons,
      },
      payroll,
    };
  }
}

module.exports = new SalaryService();
