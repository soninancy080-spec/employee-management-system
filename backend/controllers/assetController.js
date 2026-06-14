const assetService = require('../services/assetService');

class AssetController {
  async getAssets(req, res, next) {
    try {
      const search = req.query.search;
      const type = req.query.type;
      const status = req.query.status;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const result = await assetService.listAssets({ search, type, status, limit, skip });
      res.json({
        success: true,
        data: result.assets,
        total: result.total,
        page,
        limit,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAssetById(req, res, next) {
    try {
      const asset = await assetService.getAssetById(req.params.id);
      res.json({ success: true, data: asset });
    } catch (err) {
      next(err);
    }
  }

  async createAsset(req, res, next) {
    try {
      const asset = await assetService.createAsset(req.body, req.user.id);
      res.status(201).json({ success: true, data: asset });
    } catch (err) {
      next(err);
    }
  }

  async updateAsset(req, res, next) {
    try {
      const asset = await assetService.updateAsset(req.params.id, req.body, req.user.id);
      res.json({ success: true, data: asset });
    } catch (err) {
      next(err);
    }
  }

  async deleteAsset(req, res, next) {
    try {
      await assetService.deleteAsset(req.params.id, req.user.id);
      res.json({ success: true, message: 'Asset deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async allocate(req, res, next) {
    try {
      const { employeeId, notes } = req.body;
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID is required for allocation.' });
      }

      const asset = await assetService.allocateAsset(req.params.id, employeeId, notes, req.user.id);
      res.json({ success: true, message: 'Asset allocated successfully.', data: asset });
    } catch (err) {
      next(err);
    }
  }

  async returnAsset(req, res, next) {
    try {
      const { notes } = req.body;
      const asset = await assetService.returnAsset(req.params.id, notes, req.user.id);
      res.json({ success: true, message: 'Asset returned successfully.', data: asset });
    } catch (err) {
      next(err);
    }
  }

  async getMyAllocations(req, res, next) {
    try {
      const prisma = require('../db');
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id },
      });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee profile not found.' });
      }

      const allocations = await assetService.listAllocations(employee.id);
      res.json({ success: true, data: allocations });
    } catch (err) {
      next(err);
    }
  }

  async getAllAllocations(req, res, next) {
    try {
      const allocations = await assetService.listAllocations();
      res.json({ success: true, data: allocations });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AssetController();
