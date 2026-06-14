const cron = require('node-cron');
const prisma = require('../db');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Setup background tasks
function initCronJobs() {
  // 1. Daily midnight job to check for pending leaves and notify admins/HR
  // Runs every day at 00:00 (Midnight)
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily background audit job...');
    try {
      const pendingLeaves = await prisma.leaveRequest.findMany({
        where: { status: 'PENDING' },
        include: { employee: true },
      });

      if (pendingLeaves.length > 0) {
        logger.info(`Found ${pendingLeaves.length} pending leave requests requiring review.`);
        
        // Notify HR (mock email send)
        await emailService.sendMail({
          to: 'hr@ems.local',
          subject: 'Daily Alert: Pending Leave Requests Summary',
          text: `There are ${pendingLeaves.length} pending leave requests waiting for approval. Please check the Admin Dashboard.`,
          html: `<p>There are <strong>${pendingLeaves.length}</strong> pending leave requests waiting for approval.</p><p>Please log in to the <a href="http://localhost:5174">EMS Dashboard</a> to review them.</p>`
        });
      }

      // Check for overdue asset returns (e.g. allocations active for over 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const overdueAllocations = await prisma.assetAllocation.findMany({
        where: {
          returnedAt: null,
          allocatedAt: { lt: thirtyDaysAgo }
        },
        include: { employee: true, asset: true }
      });

      if (overdueAllocations.length > 0) {
        logger.info(`Found ${overdueAllocations.length} asset allocations outstanding for over 30 days.`);
        for (const alloc of overdueAllocations) {
          await emailService.sendMail({
            to: alloc.employee.email,
            subject: `Reminder: Retaining Assigned Asset ${alloc.asset.name}`,
            text: `Hi ${alloc.employee.name},\n\nYou have been holding the asset ${alloc.asset.name} (S/N: ${alloc.asset.serialNumber}) since ${alloc.allocatedAt.toDateString()}. If you no longer require it, please return it to IT support.`,
          });
        }
      }

    } catch (err) {
      logger.error('Error during daily background audit job:', err);
    }
  });

  // 2. Log hourly system health heartbeat
  // Runs every hour at minute 0
  cron.schedule('0 * * * *', () => {
    const mem = process.memoryUsage();
    logger.info(`System Heartbeat | Uptime: ${Math.floor(process.uptime())}s | RSS Memory: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
  });

  logger.info('Background cron jobs successfully scheduled.');
}

module.exports = {
  initCronJobs
};
