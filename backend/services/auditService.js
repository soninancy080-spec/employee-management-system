const auditRepository = require('../repositories/auditRepository');

class AuditService {
  async log(action, entityName, entityId, performedById, oldValues = null, newValues = null, tx = null) {
    try {
      return await auditRepository.createLog({
        action,
        entityName,
        entityId: parseInt(entityId),
        performedById: performedById ? parseInt(performedById) : null,
        oldValues,
        newValues,
      }, tx || undefined);
    } catch (err) {
      console.error('Audit logging failed:', err.message);
    }
  }

  async getLogs(page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      auditRepository.getAllLogs(limit, skip),
      auditRepository.getLogsCount(),
    ]);
    return { logs, total, page, limit };
  }
}

module.exports = new AuditService();
