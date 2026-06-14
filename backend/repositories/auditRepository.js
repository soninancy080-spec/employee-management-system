const prisma = require('../db');

class AuditRepository {
  async createLog(data, tx = prisma) {
    return await tx.auditLog.create({
      data: {
        action: data.action,
        entityName: data.entityName,
        entityId: data.entityId,
        performedById: data.performedById,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
      },
    });
  }

  async getAllLogs(limit = 100, skip = 0) {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
    });

    const userIds = [...new Set(logs.map(l => l.performedById).filter(Boolean))];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { employee: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return logs.map(log => {
      const user = log.performedById ? userMap.get(log.performedById) : null;
      const employee = user ? (user.employee || { name: user.name }) : null;

      let details = '';
      if (log.action.includes('CREATE')) {
        details = `Created new ${log.entityName.toLowerCase()}`;
        if (log.newValues && typeof log.newValues === 'object') {
          const name = log.newValues.name || log.newValues.email;
          if (name) details += ` "${name}"`;
        }
        details += ` (ID: ${log.entityId})`;
      } else if (log.action.includes('UPDATE')) {
        details = `Updated ${log.entityName.toLowerCase()}`;
        if (log.newValues && typeof log.newValues === 'object') {
          const name = log.newValues.name || log.newValues.email;
          if (name) details += ` "${name}"`;
        }
        details += ` (ID: ${log.entityId})`;
        if (log.oldValues && log.newValues) {
          const changes = [];
          for (const key of Object.keys(log.newValues)) {
            if (JSON.stringify(log.oldValues[key]) !== JSON.stringify(log.newValues[key])) {
              changes.push(key);
            }
          }
          if (changes.length > 0) {
            details += ` - Fields changed: ${changes.join(', ')}`;
          }
        }
      } else if (log.action.includes('DELETE')) {
        details = `Deleted ${log.entityName.toLowerCase()} (ID: ${log.entityId})`;
      } else if (log.action.includes('ALLOCATE') || log.action.includes('ASSIGN')) {
        details = `Allocated ${log.entityName.toLowerCase()} (ID: ${log.entityId})`;
      } else if (log.action.includes('RETURN')) {
        details = `Returned ${log.entityName.toLowerCase()} (ID: ${log.entityId})`;
      } else {
        details = `${log.entityName} (ID: ${log.entityId}) operations logged.`;
      }

      return {
        ...log,
        employee,
        details
      };
    });
  }

  async getLogsCount() {
    return await prisma.auditLog.count();
  }
}

module.exports = new AuditRepository();
