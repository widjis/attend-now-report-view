
const XLSX = require('xlsx');
const { formatDataForExport } = require('../utils/dateTimeFormatter');

// Export data to XLSX format
const exportToXlsx = async (data, res, startDate, endDate) => {
  try {
    console.log('XLSX Export - starting export process');
    
    // Validate input data
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: expected array');
    }
    
    // Log data sample for debugging
    if (data.length > 0) {
      console.log('XLSX Export - raw data sample:', JSON.stringify(data.slice(0, 2), null, 2));
    } else {
      console.log('XLSX Export - no data to export');
    }
    
    // Validate date parameters
    if (!startDate || !endDate) {
      console.warn('Missing date parameters for export', { startDate, endDate });
      // Use default dates if missing
      startDate = startDate || new Date().toISOString().split('T')[0];
      endDate = endDate || new Date().toISOString().split('T')[0];
    }
    
    if (data.length === 0) {
      console.log('XLSX Export - No data to export');
      // Create empty workbook with headers only
      const headers = [
        'Staff No', 'Name', 'Department', 'Position', 'Date',
        'Scheduled Clock In', 'Scheduled Clock Out', 'Schedule Type',
        'Actual Clock In', 'Actual Clock Out', 'Clock In Controller',
        'Clock Out Controller', 'Clock In Status', 'Clock Out Status'
      ];
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Enhanced Attendance');
      
      const filename = `enhanced-attendance-${startDate}-to-${endDate}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);
      console.log(`XLSX export completed (empty): ${filename}`);
      return;
    }
    
    // Format data for export to match frontend display
    const formattedData = formatDataForExport(data);
    console.log('XLSX Export - formatted data sample:', JSON.stringify(formattedData.slice(0, 2), null, 2));
    
    // Define column headers for better readability
    const headers = [
      'Staff No',
      'Name', 
      'Department',
      'Position',
      'Date',
      'Scheduled Clock In',
      'Scheduled Clock Out',
      'Schedule Type',
      'Actual Clock In',
      'Actual Clock Out',
      'Clock In Controller',
      'Clock Out Controller',
      'Clock In Status',
      'Clock Out Status'
    ];
    
    // Map data to match headers with null safety and error handling
    const worksheetData = [headers];
    
    // Process each row with error handling
    formattedData.forEach((row, index) => {
      try {
        // Validate row is an object
        if (!row || typeof row !== 'object') {
          console.warn(`Skipping invalid row at index ${index}:`, row);
          return;
        }
        
        // Create a sanitized row with fallbacks for all fields
        const sanitizedRow = [
          row.StaffNo || '',
          row.Name || '',
          row.Department || '',
          row.Position || '',
          row.Date || '',
          row.ScheduledClockIn || '',
          row.ScheduledClockOut || '',
          row.ScheduleType || '',
          row.ActualClockIn || '',
          row.ActualClockOut || '',
          row.ClockInController || '',
          row.ClockOutController || '',
          row.ClockInStatus || '',
          row.ClockOutStatus || ''
        ];
        
        worksheetData.push(sanitizedRow);
      } catch (err) {
        console.error(`Error processing row ${index} for Excel export:`, err.message);
        // Add an empty row with a note about the error
        worksheetData.push(['Error processing data', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      }
    });
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 12 }, // Staff No
      { wch: 25 }, // Name
      { wch: 20 }, // Department
      { wch: 15 }, // Position
      { wch: 12 }, // Date
      { wch: 16 }, // Scheduled Clock In
      { wch: 16 }, // Scheduled Clock Out
      { wch: 20 }, // Schedule Type
      { wch: 16 }, // Actual Clock In
      { wch: 16 }, // Actual Clock Out
      { wch: 30 }, // Clock In Controller
      { wch: 30 }, // Clock Out Controller
      { wch: 15 }, // Clock In Status
      { wch: 15 }  // Clock Out Status
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Add header styling
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Add freeze panes for header row
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    
    // Add auto filter
    worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enhanced Attendance');
    
    // Add metadata sheet
    const metadataData = [
      ['Export Information'],
      ['Generated Date', new Date().toISOString()],
      ['Date Range', `${startDate} to ${endDate}`],
      ['Total Records', formattedData.length],
      [''],
      ['Column Descriptions'],
      ['Staff No', 'Employee identification number'],
      ['Name', 'Employee full name'],
      ['Department', 'Employee department'],
      ['Position', 'Employee position/role'],
      ['Date', 'Attendance date'],
      ['Scheduled Clock In', 'Scheduled start time'],
      ['Scheduled Clock Out', 'Scheduled end time'],
      ['Schedule Type', 'Type of work schedule'],
      ['Actual Clock In', 'Actual clock in time'],
      ['Actual Clock Out', 'Actual clock out time'],
      ['Clock In Controller', 'Device used for clock in'],
      ['Clock Out Controller', 'Device used for clock out'],
      ['Clock In Status', 'Status of clock in (Early/OnTime/Late/Missing)'],
      ['Clock Out Status', 'Status of clock out (Early/OnTime/Late/Missing)']
    ];
    
    const metadataWorksheet = XLSX.utils.aoa_to_sheet(metadataData);
    metadataWorksheet['!cols'] = [{ wch: 25 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, metadataWorksheet, 'Export Info');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `enhanced-attendance-${startDate}-to-${endDate}-${timestamp}.xlsx`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Write to buffer and send response
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });
    
    res.send(buffer);
    
    console.log(`XLSX export completed: ${filename} (${formattedData.length} records)`);
  } catch (error) {
    console.error('Error in XLSX export:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Error generating Excel export';
    
    if (error.message.includes('Invalid data format')) {
      errorMessage = 'Invalid data format for Excel export';
    } else if (error.message.includes('Date')) {
      errorMessage = 'Error processing dates in Excel export';
    } else if (error.message.includes('toISOString')) {
      errorMessage = 'Invalid date value encountered during Excel export';
    } else if (error instanceof TypeError) {
      errorMessage = `Type error during Excel export: ${error.message}`;
    }
    
    // Add stack trace for debugging
    console.error('Excel export error details:', {
      message: errorMessage,
      originalError: error.message,
      stack: error.stack
    });
    
    // Throw a more informative error
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.cause = error;
    throw enhancedError;
  }
};

module.exports = {
  exportToXlsx
};
