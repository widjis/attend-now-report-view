
const PDFDocument = require('pdfkit');
const { formatDataForExport } = require('../utils/dateTimeFormatter');

// Export enhanced attendance data to PDF
const exportToPdf = async (data, res, startDate, endDate) => {
  try {
    console.log('PDF Export - starting export process');
    
    // Validate input data
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: expected array');
    }
    
    // Use default dates if not provided
    const exportStartDate = startDate || new Date().toISOString().split('T')[0];
    const exportEndDate = endDate || new Date().toISOString().split('T')[0];
    
    // Format the data before exporting
    const formattedData = formatDataForExport(data);
    
    // Create PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="enhanced-attendance-${exportStartDate}-to-${exportEndDate}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(16).text('Enhanced Attendance Report', { align: 'center' });
    doc.fontSize(12).text(`Period: ${exportStartDate} to ${exportEndDate}`, { align: 'center' });
    doc.moveDown();

  // Table headers
  const startX = 30;
  let currentY = doc.y;
  const rowHeight = 20;
  const colWidths = [80, 60, 60, 60, 50, 50, 50, 50, 50];
  const headers = ['Name', 'Dept', 'Position', 'Date', 'Schedule', 'Sched In', 'Sched Out', 'Actual In', 'Status'];

  // Draw header
  doc.fontSize(8);
  headers.forEach((header, i) => {
    const x = startX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
    doc.text(header, x, currentY, { width: colWidths[i], align: 'center' });
  });
  currentY += rowHeight;

  // Draw data rows (limit to prevent PDF size issues)
  formattedData.slice(0, 50).forEach((row, index) => {
    if (currentY > 750) { // Start new page if needed
      doc.addPage();
      currentY = 50;
    }
    
    const rowData = [
      (row.Name || '').substring(0, 12),
      (row.Department || '').substring(0, 8),
      (row.Position || '').substring(0, 8),
      row.Date || '',
      row.ScheduleType || '',
      row.ScheduledClockIn || '',
      row.ScheduledClockOut || '',
      row.ActualClockIn || '',
      row.ClockInStatus || ''
    ];

    rowData.forEach((cell, i) => {
      const x = startX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
      doc.text(cell, x, currentY, { width: colWidths[i], align: 'center' });
    });
    currentY += rowHeight;
  });

  if (formattedData.length > 50) {
    doc.moveDown().text(`... and ${formattedData.length - 50} more records (showing first 50)`, { align: 'center' });
  }

  doc.end();
  console.log(`PDF Export - completed successfully with ${formattedData.length} records (showing first 50 max)`);
  } catch (error) {
    console.error('PDF Export - Error during export:', error);
    
    // Provide specific error messages based on error type
    if (error instanceof TypeError) {
      console.error('PDF Export - Type error, likely invalid data format:', error.message);
    }
    
    // Log stack trace for debugging
    console.error('PDF Export - Error stack:', error.stack);
    
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF export', message: error.message });
    } else {
      // If headers already sent, end the response
      res.end();
    }
  }
};

module.exports = {
  exportToPdf
};
