const prisma = require('../db');

class NotificationRepository {
  async create(data, tx = prisma) {
    return await tx.notification.create({
      data: {
        employeeId: data.employeeId,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    });
  }

  async getByEmployee(employeeId, limit = 50, skip = 0) {
    return await prisma.notification.findMany({
      where: { employeeId },
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async getUnreadCount(employeeId) {
    return await prisma.notification.count({
      where: { employeeId, isRead: false },
    });
  }
}

module.exports = new NotificationRepository();
