const prisma = require('../db');
const { AppError } = require('../middleware/errorHandler');

class AttendanceService {
  async recordAttendance(employeeId, date, status, lateReason = null) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new AppError('Invalid date provided.', 400);
    }

    const uppercaseStatus = status.toUpperCase();
    if (!['PRESENT', 'ABSENT', 'LATE'].includes(uppercaseStatus)) {
      throw new AppError('Status must be PRESENT, ABSENT, or LATE.', 400);
    }

    if (uppercaseStatus !== 'LATE' && lateReason) {
      lateReason = null; // Reset reason if status is not LATE
    }

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    });
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    // Upsert record
    const dateOnly = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    
    return await prisma.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: dateOnly,
        },
      },
      update: {
        status: uppercaseStatus,
        lateReason: uppercaseStatus === 'LATE' ? lateReason : null,
      },
      create: {
        employeeId: employee.id,
        date: dateOnly,
        status: uppercaseStatus,
        lateReason: uppercaseStatus === 'LATE' ? lateReason : null,
      },
    });
  }

  async getAttendanceSummary(employeeId, year, month) {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    });
    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    let present = 0;
    let absent = 0;
    let late = 0;
    const latesList = [];

    records.forEach(r => {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'LATE') {
        late++;
        latesList.push({
          date: r.date,
          reason: r.lateReason || 'No reason specified',
        });
      }
    });

    const penaltyAbsents = Math.floor(late / 3);
    const totalDays = records.length;

    return {
      employeeId: employee.id,
      name: employee.name,
      totalDays,
      present,
      absent,
      late,
      penaltyAbsents,
      totalAbsents: absent + penaltyAbsents,
      netPayableDays: Math.max(0, (present + late) - penaltyAbsents),
      latesDetail: latesList,
      rawRecords: records,
    };
  }

  async getFilteredReport(filters) {
    const { semester, city, domain, trackingMode } = filters;
    const where = {};

    if (semester) where.semester = semester;
    if (city) where.city = city;
    if (domain) where.domain = domain;
    if (trackingMode) where.trackingMode = trackingMode;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        attendance: true,
      },
      orderBy: { name: 'asc' },
    });

    const totalRegistered = await prisma.employee.count();

    const report = employees.map(emp => {
      let present = 0;
      let absent = 0;
      let late = 0;
      const reasons = [];

      emp.attendance.forEach(a => {
        if (a.status === 'PRESENT') present++;
        else if (a.status === 'ABSENT') absent++;
        else if (a.status === 'LATE') {
          late++;
          if (a.lateReason) reasons.push(a.lateReason);
        }
      });

      const penaltyAbsents = Math.floor(late / 3);

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        semester: emp.semester || 'N/A',
        city: emp.city || 'N/A',
        domain: emp.domain || 'N/A',
        trackingMode: emp.trackingMode,
        grossSalary: emp.grossSalary,
        present,
        absent,
        late,
        penaltyAbsents,
        totalAbsents: absent + penaltyAbsents,
        lateReasons: reasons,
      };
    });

    return {
      totalRegistered,
      filteredCount: report.length,
      data: report,
    };
  }
}

module.exports = new AttendanceService();
