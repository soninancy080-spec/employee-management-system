const attendanceService = require('../services/attendanceService');
const prisma = require('../db');

jest.mock('../db', () => ({
  employee: {
    findUnique: jest.fn(),
  },
  attendanceRecord: {
    findMany: jest.fn(),
  },
}));

describe('Attendance Penalty Calculations', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Should calculate penalty absents: 3 lates = 1 absent penalty', async () => {
    // Mock employee profile
    prisma.employee.findUnique.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      grossSalary: 30000,
    });

    // Mock attendance records: 20 present, 2 absent, 6 late records (total 28 days logged)
    const mockRecords = [
      ...Array(20).fill().map((_, i) => ({ id: i, status: 'PRESENT', date: new Date(2026, 5, i + 1) })),
      ...Array(2).fill().map((_, i) => ({ id: i + 20, status: 'ABSENT', date: new Date(2026, 5, i + 21) })),
      ...Array(6).fill().map((_, i) => ({ id: i + 22, status: 'LATE', lateReason: 'Traffic', date: new Date(2026, 5, i + 23) })),
    ];

    prisma.attendanceRecord.findMany.mockResolvedValue(mockRecords);

    const summary = await attendanceService.getAttendanceSummary(1, 2026, 6);

    expect(summary.present).toBe(20);
    expect(summary.absent).toBe(2);
    expect(summary.late).toBe(6);
    expect(summary.penaltyAbsents).toBe(2); // 6 lates / 3 = 2 penalty absents
    expect(summary.totalAbsents).toBe(4);    // 2 absent + 2 penalty = 4
    expect(summary.netPayableDays).toBe(24);  // (20 present + 6 late) - 2 penalty = 24 payable days
  });

  test('Should handle late count less than 3 without penalization', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 1,
      name: 'John Doe',
    });

    const mockRecords = [
      { id: 1, status: 'PRESENT', date: new Date(2026, 5, 1) },
      { id: 2, status: 'LATE', lateReason: 'Train delayed', date: new Date(2026, 5, 2) },
      { id: 3, status: 'LATE', lateReason: 'Overslept', date: new Date(2026, 5, 3) },
    ];

    prisma.attendanceRecord.findMany.mockResolvedValue(mockRecords);

    const summary = await attendanceService.getAttendanceSummary(1, 2026, 6);

    expect(summary.present).toBe(1);
    expect(summary.late).toBe(2);
    expect(summary.penaltyAbsents).toBe(0); // 2 lates < 3, no penalty
    expect(summary.netPayableDays).toBe(3);  // 1 present + 2 late - 0 penalty = 3
  });
});
