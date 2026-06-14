const prisma = require('../db');
const { AppError } = require('../middleware/errorHandler');

class ReportService {
  convertToCSV(data, headers) {
    const headerLine = headers.map(h => `"${h.label}"`).join(',');
    const rowLines = data.map(row => {
      return headers.map(h => {
        let val = row[h.key];
        if (val === null || val === undefined) {
          val = '';
        } else if (val instanceof Date) {
          val = val.toISOString();
        } else {
          val = String(val).replace(/"/g, '""');
        }
        return `"${val}"`;
      }).join(',');
    });
    return [headerLine, ...rowLines].join('\n');
  }

  async getEmployeesCSV() {
    const employees = await prisma.$queryRawUnsafe(
      'SELECT * FROM employee_details_view ORDER BY name ASC',
    );

    const headers = [
      { key: 'id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'department_name', label: 'Department' },
      { key: 'manager_name', label: 'Manager' },
      { key: 'role', label: 'System Role' },
      { key: 'created_at', label: 'Registration Date' },
    ];

    return this.convertToCSV(employees, headers);
  }

  async getLeavesCSV() {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        employee: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = leaves.map(l => {
      const duration = Math.ceil(Math.abs(new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      return {
        id: l.id,
        employeeName: l.employee.name,
        employeeEmail: l.employee.email,
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        duration,
        status: l.status,
        reason: l.reason,
        managerNotes: l.managerNotes || '',
        hrNotes: l.hrNotes || '',
        createdAt: l.createdAt,
      };
    });

    const headers = [
      { key: 'id', label: 'Request ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'employeeEmail', label: 'Employee Email' },
      { key: 'leaveType', label: 'Leave Type' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'duration', label: 'Duration (Days)' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
      { key: 'managerNotes', label: 'Manager Notes' },
      { key: 'hrNotes', label: 'HR Notes' },
      { key: 'createdAt', label: 'Applied At' },
    ];

    return this.convertToCSV(formatted, headers);
  }

  async getAssetsCSV() {
    const assets = await prisma.asset.findMany({
      include: {
        allocations: {
          where: { returnedAt: null },
          include: {
            employee: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = assets.map(a => {
      const activeAlloc = a.allocations[0];
      return {
        id: a.id,
        name: a.name,
        serialNumber: a.serialNumber,
        type: a.type,
        status: a.status,
        employeeName: activeAlloc ? activeAlloc.employee.name : 'N/A',
        employeeEmail: activeAlloc ? activeAlloc.employee.email : 'N/A',
        allocatedAt: activeAlloc ? activeAlloc.allocatedAt : '',
      };
    });

    const headers = [
      { key: 'id', label: 'Asset ID' },
      { key: 'name', label: 'Asset Name' },
      { key: 'serialNumber', label: 'Serial Number' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'employeeName', label: 'Assigned To (Name)' },
      { key: 'employeeEmail', label: 'Assigned To (Email)' },
      { key: 'allocatedAt', label: 'Assigned Date' },
    ];

    return this.convertToCSV(formatted, headers);
  }
}

module.exports = new ReportService();
