const prisma = require('../db');

class AssetRepository {
  async create(data) {
    return await prisma.asset.create({
      data: {
        name: data.name,
        serialNumber: data.serialNumber,
        type: data.type,
        status: data.status || 'AVAILABLE',
      },
    });
  }

  async findById(id) {
    return await prisma.asset.findUnique({
      where: { id: parseInt(id) },
      include: {
        allocations: {
          orderBy: { allocatedAt: 'desc' },
          include: {
            employee: true,
          },
        },
      },
    });
  }

  async findBySerialNumber(serialNumber) {
    return await prisma.asset.findUnique({
      where: { serialNumber },
    });
  }

  async update(id, data) {
    return await prisma.asset.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return await prisma.asset.delete({
      where: { id: parseInt(id) },
    });
  }

  async findAll(filters) {
    const { search, type, status, limit = 10, skip = 0 } = filters;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          allocations: {
            where: { returnedAt: null },
            include: {
              employee: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return { assets, total };
  }

  async callAllocateAssetFunc(assetId, employeeId, notes) {
    const result = await prisma.$queryRawUnsafe(
      `SELECT allocate_asset_func($1, $2, $3) AS "allocationId"`,
      parseInt(assetId),
      parseInt(employeeId),
      notes || '',
    );
    return result[0]?.allocationId;
  }

  async callReturnAssetFunc(assetId, notes) {
    await prisma.$queryRawUnsafe(
      `SELECT return_asset_func($1, $2)`,
      parseInt(assetId),
      notes || '',
    );
  }

  async getActiveAllocation(assetId) {
    return await prisma.assetAllocation.findFirst({
      where: { assetId: parseInt(assetId), returnedAt: null },
      include: {
        employee: true,
        asset: true,
      },
    });
  }

  async getAllAllocations(employeeId = null) {
    const where = {};
    if (employeeId) {
      where.employeeId = parseInt(employeeId);
    }
    return await prisma.assetAllocation.findMany({
      where,
      orderBy: { allocatedAt: 'desc' },
      include: {
        asset: true,
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}

module.exports = new AssetRepository();
