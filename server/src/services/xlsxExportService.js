
const XLSX = require('xlsx');
const { formatDataForExport } = require('../utils/dateTimeFormatter');

// Export data to XLSX format
const exportToXlsx = async (data, res, startDate, endDate) => {
  try {
    console.log('XLSX Export - raw data sample:', JSON.stringify(data.slice(0, 2), null, 2));
    
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
    
    // Map data to match headers
    const worksheetData = [
      headers,
      ...formattedData.map(row => [
        row.StaffNo,
        row.Name,
        row.Department,
        row.Position,
        row.Date,
        row.ScheduledClockIn,
        row.ScheduledClockOut,
        row.ScheduleType,
        row.ActualClockIn,
        row.ActualClockOut,
        row.ClockInController,
        row.ClockOutController,
        row.ClockInStatus,
        row.ClockOutStatus
      ])
    ];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 12 }, // Staff No
      { wch: 25 }, // Name
      { wch: 20 }, // Department
      { wch: 12 }, // Position
      { wch: 12 }, // Date
      { wch: 15 }, // Scheduled Clock In
      { wch: 15 }, // Scheduled Clock Out
      { wch: 18 }, // Schedule Type
      { wch: 15 }, // Actual Clock In
      { wch: 15 }, // Actual Clock Out
      { wch: 25 }, // Clock In Controller
      { wch: 25 }, // Clock Out Controller
      { wch: 15 }, // Clock In Status
      { wch: 15 }  // Clock Out Status
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enhanced Attendance');
    
    // Generate filename
    const filename = `enhanced-attendance-${startDate}-to-${endDate}.xlsx`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Write to buffer and send response
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);
    
    console.log(`XLSX export completed: ${filename}`);
  } catch (error) {
    console.error('Error in XLSX export:', error);
    throw error;
  }
};

module.exports = {
  exportToXlsx
};
