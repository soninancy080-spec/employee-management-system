const reportService = require('../services/reportService');

class ReportController {
  async exportReport(req, res, next) {
    try {
      const { type } = req.query;
      let csvContent = '';
      let filename = 'report.csv';

      if (type === 'employees') {
        csvContent = await reportService.getEmployeesCSV();
        filename = 'employees_report.csv';
      } else if (type === 'leaves') {
        csvContent = await reportService.getLeavesCSV();
        filename = 'leaves_report.csv';
      } else if (type === 'assets') {
        csvContent = await reportService.getAssetsCSV();
        filename = 'assets_report.csv';
      } else {
        return res.status(400).json({ success: false, message: 'Invalid report type. Supported types: employees, leaves, assets.' });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
