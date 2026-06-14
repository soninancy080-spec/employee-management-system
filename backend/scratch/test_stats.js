const prisma = require('../db');

async function testStats() {
  try {
    const [totalEmployees, totalDepartments, totalSkills, totalAssets, allocatedAssets] = await Promise.all([
      prisma.employee.count(),
      prisma.department.count(),
      prisma.skill.count(),
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'ALLOCATED' } }),
    ]);

    const departmentStats = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { employees: true } }
      },
      orderBy: { name: 'asc' }
    });

    const departmentDistribution = departmentStats.map(dept => ({
      id: dept.id,
      name: dept.name,
      employeeCount: dept._count.employees
    }));

    const skillStats = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { employees: true } }
      },
      orderBy: { name: 'asc' }
    });

    const skillDistribution = skillStats.map(skill => ({
      id: skill.id,
      name: skill.name,
      employeeCount: skill._count.employees
    }));

    const recentEmployees = await prisma.employee.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { department: true }
    });

    const [
      assetStatusStats,
      assetTypeStats,
      trackingModeStats,
      cityStats,
      domainStats,
      semesterStats,
      attendanceStats
    ] = await Promise.all([
      prisma.asset.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      prisma.asset.groupBy({
        by: ['type'],
        _count: { _all: true }
      }),
      prisma.employee.groupBy({
        by: ['trackingMode'],
        _count: { _all: true }
      }),
      prisma.employee.groupBy({
        by: ['city'],
        _count: { _all: true }
      }),
      prisma.employee.groupBy({
        by: ['domain'],
        _count: { _all: true }
      }),
      prisma.employee.groupBy({
        by: ['semester'],
        _count: { _all: true }
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    console.log('Stats execution completed successfully!');
    console.log({
      counts: {
        employees: totalEmployees,
        departments: totalDepartments,
        skills: totalSkills,
        assets: totalAssets,
        allocatedAssets
      },
      departmentDistribution,
      skillDistribution,
      recentEmployees
    });
  } catch (err) {
    console.error('Stats execution failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testStats();
