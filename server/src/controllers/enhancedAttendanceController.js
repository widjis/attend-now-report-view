const { getEnhancedAttendanceData, getEnhancedAttendanceForExport } = require('../services/enhancedAttendanceService');
const { exportToCsv } = require('../services/csvExportService');
const { exportToPdf } = require('../services/pdfExportService');
const { exportToXlsx } = require('../services/xlsxExportService');

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

    console.log('Frontend request filters:', filters);
    const result = await getEnhancedAttendanceData(filters);
    console.log('Frontend response data sample:', JSON.stringify(result.data.slice(0, 2), null, 2));
    
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
    console.log('CSV Export called - using enhanced attendance controller');
    
    const {
      startDate,
      endDate,
      search = '',
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus
    } = req.query;

    // Validate date parameters but allow them to be optional
    // The exportToCsv function will handle missing dates with defaults
    
    const filters = {
      startDate,
      endDate,
      search,
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus
    };

    console.log('CSV Export filters:', filters);
    
    try {
      const data = await getEnhancedAttendanceForExport(filters);
      
      if (!data || !Array.isArray(data)) {
        console.error('CSV Export - Invalid data returned from service:', typeof data);
        return res.status(500).json({ error: 'Failed to retrieve data for export' });
      }
      
      console.log(`CSV Export - Retrieved ${data.length} records for export`);
      if (data.length > 0) {
        console.log('CSV Export raw data sample:', JSON.stringify(data.slice(0, 2), null, 2));
      } else {
        console.log('CSV Export - No data found matching the filters');
      }
      
      await exportToCsv(data, res, startDate, endDate);
    } catch (dataErr) {
      console.error('CSV Export - Error retrieving or processing data:', dataErr);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to generate CSV export', 
          message: dataErr.message || 'Error retrieving data for export'
        });
      }
    }
  } catch (err) {
    console.error('Error exporting enhanced attendance to CSV:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
};

// Export enhanced attendance data to PDF
exports.exportEnhancedAttendanceToPdf = async (req, res, next) => {
  try {
    console.log('PDF Export called - using enhanced attendance controller');
    
    const {
      startDate,
      endDate,
      search = '',
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus
    } = req.query;

    // Validate date parameters but allow them to be optional
    // The exportToPdf function will handle missing dates with defaults
    
    const filters = {
      startDate,
      endDate,
      search,
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus
    };

    console.log('PDF Export filters:', filters);
    
    try {
      const data = await getEnhancedAttendanceForExport(filters);
      
      if (!data || !Array.isArray(data)) {
        console.error('PDF Export - Invalid data returned from service:', typeof data);
        return res.status(500).json({ error: 'Failed to retrieve data for export' });
      }
      
      console.log(`PDF Export - Retrieved ${data.length} records for export`);
      if (data.length > 0) {
        console.log('PDF Export raw data sample:', JSON.stringify(data.slice(0, 2), null, 2));
      } else {
        console.log('PDF Export - No data found matching the filters');
      }
      
      await exportToPdf(data, res, startDate, endDate);
    } catch (dataErr) {
      console.error('PDF Export - Error retrieving or processing data:', dataErr);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to generate PDF export', 
          message: dataErr.message || 'Error retrieving data for export'
        });
      }
    }
  } catch (err) {
    console.error('Error exporting enhanced attendance to PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
};

// Export enhanced attendance data to XLSX
exports.exportEnhancedAttendanceToXlsx = async (req, res, next) => {
  try {
    console.log('XLSX Export called - using enhanced attendance controller');
    
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

    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD format.' });
    }

    if (startDateObj > endDateObj) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
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

    console.log('XLSX Export filters:', filters);
    
    const data = await getEnhancedAttendanceForExport(filters);
    
    if (!data) {
      console.log('XLSX Export - No data returned from service');
      return res.status(404).json({ error: 'No data found for the specified criteria' });
    }
    
    console.log(`XLSX Export - Retrieved ${data.length} records`);
    await exportToXlsx(data, res, startDate, endDate);
    
  } catch (err) {
    console.error('Error exporting enhanced attendance to XLSX:', err);
    
    // Check if response has already been sent
    if (res.headersSent) {
      console.error('Response already sent, cannot send error response');
      return;
    }
    
    // Provide specific error messages based on error type
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;
    
    if (err.message.includes('Invalid data format')) {
      errorMessage = 'Data format error during export';
      statusCode = 422;
    } else if (err.message.includes('database') || err.message.includes('connection')) {
      errorMessage = 'Database connection error';
      statusCode = 503;
    } else if (err.message.includes('timeout')) {
      errorMessage = 'Export operation timed out. Please try with a smaller date range.';
      statusCode = 408;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage, 
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
};
