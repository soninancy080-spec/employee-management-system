const prisma = require('../db');

async function dumpAll() {
  try {
    const users = await prisma.user.findMany();
    const employees = await prisma.employee.findMany();
    const departments = await prisma.department.findMany();
    const skills = await prisma.skill.findMany();
    const assets = await prisma.asset.findMany();
    const assetAllocations = await prisma.assetAllocation.findMany();
    const leaveRequests = await prisma.leaveRequest.findMany();
    const leaveBalances = await prisma.leaveBalance.findMany();
    const leaveHistories = await prisma.leaveHistory.findMany();
    const attendanceRecords = await prisma.attendanceRecord.findMany();
    const notifications = await prisma.notification.findMany();
    const auditLogs = await prisma.auditLog.findMany();

    console.log('--- DB DUMP ---');
    console.log(`Users (${users.length}):`, users);
    console.log(`Employees (${employees.length}):`, employees);
    console.log(`Departments (${departments.length}):`, departments);
    console.log(`Skills (${skills.length}):`, skills);
    console.log(`Assets (${assets.length}):`, assets);
    console.log(`Asset Allocations (${assetAllocations.length}):`, assetAllocations);
    console.log(`Leave Requests (${leaveRequests.length}):`, leaveRequests);
    console.log(`Leave Balances (${leaveBalances.length}):`, leaveBalances);
    console.log(`Leave Histories (${leaveHistories.length}):`, leaveHistories);
    console.log(`Attendance Records (${attendanceRecords.length}):`, attendanceRecords);
    console.log(`Notifications (${notifications.length}):`, notifications);
    console.log(`Audit Logs (${auditLogs.length}):`, auditLogs);
  } catch (err) {
    console.error('Error dumping database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

dumpAll();
