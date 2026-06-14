const auditService = require('../services/auditService');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const result = await auditService.getLogs(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuditController();
