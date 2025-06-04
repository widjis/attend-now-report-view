
const { getEnhancedAttendanceData, getEnhancedAttendanceForExport } = require('../services/enhancedAttendanceService');
const { exportToCsv } = require('../services/csvExportService');
const { exportToPdf } = require('../services/pdfExportService');

// Get enhanced attendance data (combining schedule and actual attendance)
exports.getEnhancedAttendanceData = async (req, res, next) => {
  try {
    // Get query parameters for filtering and pagination
    const {
      startDate,
      endDate,
      search = '',
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus,
      page = 1,
      pageSize = 10
    } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const filters = {
      startDate,
      endDate,
      search,
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus,
      page,
      pageSize
    };

    const result = await getEnhancedAttendanceData(filters);
    res.json(result);
  } catch (err) {
    console.error('Error fetching enhanced attendance data:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: err.message
    });
  }
};

// Export enhanced attendance data to CSV
exports.exportEnhancedAttendanceToCsv = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      search = '',
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const filters = {
      startDate,
      endDate,
      search,
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus
    };

    const data = await getEnhancedAttendanceForExport(filters);
    await exportToCsv(data, res, startDate, endDate);
  } catch (err) {
    console.error('Error exporting enhanced attendance to CSV:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

// Export enhanced attendance data to PDF
exports.exportEnhancedAttendanceToPdf = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      search = '',
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const filters = {
      startDate,
      endDate,
      search,
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus
    };

    const data = await getEnhancedAttendanceForExport(filters);
    await exportToPdf(data, res, startDate, endDate);
  } catch (err) {
    console.error('Error exporting enhanced attendance to PDF:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
