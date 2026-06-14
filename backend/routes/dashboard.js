const express = require('express');
const router = express.Router();
const prisma = require('../db');
const auth = require('../middleware/auth');

// @route   GET api/dashboard/stats
// @desc    Get dashboard metrics, department distribution, skill distribution, and recent hires
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // 1. Fetch total counts
    const [totalEmployees, totalDepartments, totalSkills, totalAssets, allocatedAssets] = await Promise.all([
      prisma.employee.count(),
      prisma.department.count(),
      prisma.skill.count(),
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'ALLOCATED' } }),
    ]);

    // 2. Fetch employee count per department (JOIN query)
    const departmentStats = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { employees: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const departmentDistribution = departmentStats.map(dept => ({
      id: dept.id,
      name: dept.name,
      employeeCount: dept._count.employees
    }));

    // 3. Fetch employee count per skill (JOIN query)
    const skillStats = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { employees: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const skillDistribution = skillStats.map(skill => ({
      id: skill.id,
      name: skill.name,
      employeeCount: skill._count.employees
    }));

    // 4. Fetch the 5 most recent hires
    const recentEmployees = await prisma.employee.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        department: true
      }
    });

    // 5. Fetch asset status and type distribution
    // 6. Fetch trackingMode, city, domain, semester distributions for employees
    // 7. Fetch system-wide attendance stats (PRESENT, ABSENT, LATE)
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

    const statusDistribution = assetStatusStats.map(stat => ({
      status: stat.status,
      count: stat._count._all
    }));

    const typeDistribution = assetTypeStats.map(stat => ({
      type: stat.type,
      count: stat._count._all
    }));

    const trackingModeDistribution = trackingModeStats.map(stat => ({
      mode: stat.trackingMode,
      count: stat._count._all
    }));

    const cityDistribution = cityStats.map(stat => ({
      city: stat.city || 'Unspecified',
      count: stat._count._all
    }));

    const domainDistribution = domainStats.map(stat => ({
      domain: stat.domain || 'Unspecified',
      count: stat._count._all
    }));

    const semesterDistribution = semesterStats.map(stat => ({
      semester: stat.semester || 'Unspecified',
      count: stat._count._all
    }));

    const attendanceDistribution = attendanceStats.map(stat => ({
      status: stat.status,
      count: stat._count._all
    }));

    res.json({
      counts: {
        employees: totalEmployees,
        departments: totalDepartments,
        skills: totalSkills,
        assets: totalAssets,
        allocatedAssets
      },
      departmentDistribution,
      skillDistribution,
      recentEmployees,
      assetStats: {
        statusDistribution,
        typeDistribution
      },
      distributions: {
        trackingMode: trackingModeDistribution,
        city: cityDistribution,
        domain: domainDistribution,
        semester: semesterDistribution,
        attendance: attendanceDistribution
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
