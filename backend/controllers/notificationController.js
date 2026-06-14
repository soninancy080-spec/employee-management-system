const notificationService = require('../services/notificationService');

class NotificationController {
  async getMyNotifications(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const result = await notificationService.getNotificationsForUser(req.user.id, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await notificationService.markRead(id, req.user.id);
      res.json({ success: true, notification: updated });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
