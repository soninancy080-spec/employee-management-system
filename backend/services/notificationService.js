const notificationRepository = require('../repositories/notificationRepository');
const prisma = require('../db');
const { AppError } = require('../middleware/errorHandler');

class NotificationService {
  async notify(employeeId, title, message, type, tx = null) {
    try {
      return await notificationRepository.create({
        employeeId: parseInt(employeeId),
        title,
        message,
        type,
      }, tx || undefined);
    } catch (err) {
      console.error('Error creating notification:', err.message);
    }
  }

  async getNotificationsForUser(userId, page = 1, limit = 50) {
    const employee = await prisma.employee.findUnique({
      where: { userId: parseInt(userId) },
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const skip = (page - 1) * limit;
    const notifications = await notificationRepository.getByEmployee(employee.id, limit, skip);
    const unreadCount = await notificationRepository.getUnreadCount(employee.id);

    return { notifications, unreadCount };
  }

  async markRead(id, userId) {
    const employee = await prisma.employee.findUnique({
      where: { userId: parseInt(userId) },
    });
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      throw new AppError('Notification not found.', 404);
    }

    if (notification.employeeId !== employee.id) {
      throw new AppError('Access denied: notification belongs to another employee.', 403);
    }

    return await notificationRepository.markAsRead(parseInt(id));
  }
}

module.exports = new NotificationService();
