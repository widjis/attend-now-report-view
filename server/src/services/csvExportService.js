
const { stringify } = require('csv-stringify');
const { formatDataForExport } = require('../utils/dateTimeFormatter');

// Export enhanced attendance data to CSV
const exportToCsv = async (data, res, startDate, endDate) => {
  // Format the data before exporting
  const formattedData = formatDataForExport(data);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="enhanced-attendance-export-${startDate}-to-${endDate}.csv"`);
  
  const stringifier = stringify({ header: true, columns: Object.keys(formattedData[0] || {}) });
  stringifier.pipe(res);
  
  formattedData.forEach(record => stringifier.write(record));
  stringifier.end();
};

module.exports = {
  exportToCsv
};
