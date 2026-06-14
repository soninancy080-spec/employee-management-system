const assetRepository = require('../repositories/assetRepository');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const { AppError } = require('../middleware/errorHandler');
const prisma = require('../db');

class AssetService {
  async createAsset(data, performedById) {
    const existing = await assetRepository.findBySerialNumber(data.serialNumber);
    if (existing) {
      throw new AppError(`Asset with serial number ${data.serialNumber} already exists.`, 400);
    }

    const asset = await assetRepository.create(data);
    await auditService.log(
      'ASSET_CREATE',
      'Asset',
      asset.id,
      performedById,
      null,
      asset,
    );
    return asset;
  }

  async getAssetById(id) {
    const asset = await assetRepository.findById(id);
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }
    return asset;
  }

  async updateAsset(id, data, performedById) {
    const oldAsset = await assetRepository.findById(id);
    if (!oldAsset) {
      throw new AppError('Asset not found.', 404);
    }

    if (data.serialNumber && data.serialNumber !== oldAsset.serialNumber) {
      const existing = await assetRepository.findBySerialNumber(data.serialNumber);
      if (existing) {
        throw new AppError(`Asset with serial number ${data.serialNumber} already exists.`, 400);
      }
    }

    const updatedAsset = await assetRepository.update(id, data);

    const oldValues = { name: oldAsset.name, serialNumber: oldAsset.serialNumber, type: oldAsset.type, status: oldAsset.status };
    const newValues = { name: updatedAsset.name, serialNumber: updatedAsset.serialNumber, type: updatedAsset.type, status: updatedAsset.status };

    await auditService.log(
      'ASSET_UPDATE',
      'Asset',
      id,
      performedById,
      oldValues,
      newValues,
    );
    return updatedAsset;
  }

  async deleteAsset(id, performedById) {
    const oldAsset = await assetRepository.findById(id);
    if (!oldAsset) {
      throw new AppError('Asset not found.', 404);
    }

    await assetRepository.delete(id);
    await auditService.log(
      'ASSET_DELETE',
      'Asset',
      id,
      performedById,
      oldAsset,
      null,
    );
  }

  async listAssets(filters) {
    return await assetRepository.findAll(filters);
  }

  async allocateAsset(assetId, employeeId, notes, performedById) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    });
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const allocationId = await assetRepository.callAllocateAssetFunc(assetId, employeeId, notes);

    const updatedAsset = await assetRepository.findById(assetId);

    await notificationService.notify(
      employeeId,
      'Asset Allocated',
      `You have been allocated a new ${updatedAsset.type}: ${updatedAsset.name} (S/N: ${updatedAsset.serialNumber}).`,
      'ASSET',
    );

    await auditService.log(
      'ASSET_ALLOCATE',
      'Asset',
      assetId,
      performedById,
      { status: asset.status },
      { status: updatedAsset.status, employeeId, allocationId },
    );

    return updatedAsset;
  }

  async returnAsset(assetId, notes, performedById) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    const activeAllocation = await assetRepository.getActiveAllocation(assetId);
    if (!activeAllocation) {
      throw new AppError('Asset is not currently allocated.', 400);
    }

    const employeeId = activeAllocation.employeeId;

    await assetRepository.callReturnAssetFunc(assetId, notes);

    const updatedAsset = await assetRepository.findById(assetId);

    await notificationService.notify(
      employeeId,
      'Asset Returned',
      `Your allocated ${updatedAsset.type}: ${updatedAsset.name} (S/N: ${updatedAsset.serialNumber}) has been marked as returned.`,
      'ASSET',
    );

    await auditService.log(
      'ASSET_RETURN',
      'Asset',
      assetId,
      performedById,
      { status: asset.status, employeeId },
      { status: updatedAsset.status },
    );

    return updatedAsset;
  }

  async listAllocations(employeeId = null) {
    return await assetRepository.getAllAllocations(employeeId);
  }
}

module.exports = new AssetService();
