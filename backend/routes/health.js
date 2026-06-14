const express = require('express');
const router = express.Router();
const prisma = require('../db');

router.get('/', async (req, res) => {
  let dbStatus = 'UP';
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'DOWN';
  }

  res.json({
    status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: dbStatus,
    memory: process.memoryUsage(),
  });
});

module.exports = router;
