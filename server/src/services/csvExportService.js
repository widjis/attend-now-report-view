
const { stringify } = require('csv-stringify');
const { formatDataForExport } = require('../utils/dateTimeFormatter');

// Export enhanced attendance data to CSV
const exportToCsv = async (data, res, startDate, endDate) => {
  try {
    console.log('CSV Export - starting export process');
    
    // Validate input data
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: expected array');
    }
    
    // Use default dates if not provided
    const exportStartDate = startDate || new Date().toISOString().split('T')[0];
    const exportEndDate = endDate || new Date().toISOString().split('T')[0];
    
    // Format the data before exporting
    const formattedData = formatDataForExport(data);
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="enhanced-attendance-export-${exportStartDate}-to-${exportEndDate}.csv"`);
    
    // Create CSV stringifier
    const stringifier = stringify({ header: true, columns: Object.keys(formattedData[0] || {}) });
    stringifier.pipe(res);
    
    // Write data to CSV
    formattedData.forEach(record => stringifier.write(record));
    stringifier.end();
    
    console.log(`CSV Export - completed successfully with ${formattedData.length} records`);
  } catch (error) {
    console.error('CSV Export - Error during export:', error);
    
    // Provide specific error messages based on error type
    if (error instanceof TypeError) {
      console.error('CSV Export - Type error, likely invalid data format:', error.message);
    }
    
    // Log stack trace for debugging
    console.error('CSV Export - Error stack:', error.stack);
    
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate CSV export', message: error.message });
    } else {
      // If headers already sent, end the response
      res.end();
    }
  }
};

module.exports = {
  exportToCsv
};
