
const { poolPromise, sql } = require('../config/db');
const { stringify } = require('csv-stringify');
const PDFDocument = require('pdfkit');

// Export attendance data to CSV
exports.exportToCsv = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      search = '',
      department,
      company,
      cardType
    } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const pool = await poolPromise;
    
    // Build query with filters
    let query = `
      SELECT 
        CardNo, 
        Name, 
        Title, 
        Position, 
        Department, 
        CardType, 
        Gender,
        MaritalStatus,
        Company,
        StaffNo,
        TrDateTime,
        TrDate,
        dtTransaction,
        TrController,
        ClockEvent,
        Processed
      FROM tblAttendanceReport
      WHERE TrDate BETWEEN @startDate AND @endDate
    `;
    
    const params = [
      { name: 'startDate', type: sql.Date, value: startDate },
      { name: 'endDate', type: sql.Date, value: endDate }
    ];

    if (search) {
      query += ` AND (Name LIKE @search OR StaffNo LIKE @search OR CardNo LIKE @search)`;
      params.push({ name: 'search', value: `%${search}%` });
    }

    if (department && department !== 'all') {
      query += ` AND Department = @department`;
      params.push({ name: 'department', value: department });
    }

    if (company && company !== 'all') {
      query += ` AND Company = @company`;
      params.push({ name: 'company', value: company });
    }

    if (cardType && cardType !== 'all') {
      query += ` AND CardType = @cardType`;
      params.push({ name: 'cardType', value: cardType });
    }

    query += ` ORDER BY TrDateTime DESC`;

    // Execute the query
    const request = pool.request();
    
    // Add parameters
    params.forEach(param => {
      request.input(param.name, param.type || sql.VarChar, param.value);
    });
    
    const result = await request.query(query);
    const data = result.recordset;

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-export-${startDate}-to-${endDate}.csv"`);

    // Create CSV stringifier
    const stringifier = stringify({ header: true, columns: Object.keys(data[0] || {}) });
    
    // Pipe the data to response
    stringifier.pipe(res);
    
    // Write data to stringifier
    data.forEach(record => stringifier.write(record));
    
    // End the stream
    stringifier.end();
  } catch (err) {
    next(err);
  }
};

// Export attendance data to PDF
exports.exportToPdf = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      search = '',
      department,
      company,
      cardType
    } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const pool = await poolPromise;
    
    // Build query with filters
    let query = `
      SELECT TOP 1000
        CardNo, 
        Name, 
        Department, 
        TrDateTime,
        TrDate,
        TrController,
        ClockEvent,
        CASE WHEN Processed = 1 THEN 'Valid' ELSE 'Invalid' END AS Status
      FROM tblAttendanceReport
      WHERE TrDate BETWEEN @startDate AND @endDate
    `;
    
    const params = [
      { name: 'startDate', type: sql.Date, value: startDate },
      { name: 'endDate', type: sql.Date, value: endDate }
    ];

    if (search) {
      query += ` AND (Name LIKE @search OR StaffNo LIKE @search OR CardNo LIKE @search)`;
      params.push({ name: 'search', value: `%${search}%` });
    }

    if (department && department !== 'all') {
      query += ` AND Department = @department`;
      params.push({ name: 'department', value: department });
    }

    if (company && company !== 'all') {
      query += ` AND Company = @company`;
      params.push({ name: 'company', value: company });
    }

    if (cardType && cardType !== 'all') {
      query += ` AND CardType = @cardType`;
      params.push({ name: 'cardType', value: cardType });
    }

    query += ` ORDER BY TrDateTime DESC`;

    // Execute the query
    const request = pool.request();
    
    // Add parameters
    params.forEach(param => {
      request.input(param.name, param.type || sql.VarChar, param.value);
    });
    
    const result = await request.query(query);
    const data = result.recordset;

    // Create a PDF document
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-export-${startDate}-to-${endDate}.pdf"`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add title
    doc.fontSize(16).font('Helvetica-Bold').text('Attendance Report', { align: 'center' });
    doc.moveDown();
    
    // Add date range
    doc.fontSize(12).font('Helvetica').text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
    doc.moveDown();

    // Add filters applied
    let filtersText = 'Filters: ';
    const filterParts = [];
    
    if (department && department !== 'all') filterParts.push(`Department: ${department}`);
    if (company && company !== 'all') filterParts.push(`Company: ${company}`);
    if (cardType && cardType !== 'all') filterParts.push(`Card Type: ${cardType}`);
    if (search) filterParts.push(`Search: "${search}"`);
    
    filtersText += filterParts.length > 0 ? filterParts.join(', ') : 'None';
    
    doc.text(filtersText);
    doc.moveDown();

    // Add total records count
    doc.text(`Total Records: ${data.length}${data.length === 1000 ? ' (limited to 1000)' : ''}`);
    doc.moveDown();

    // Define table layout
    const tableTop = 160;
    const tableColumnWidth = [80, 120, 100, 120, 60, 60];
    const headers = ['Card No', 'Name', 'Department', 'Date/Time', 'Event', 'Status'];
    
    // Draw table header
    doc.font('Helvetica-Bold').fontSize(10);
    let xPos = 30;
    
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop, { width: tableColumnWidth[i], align: 'left' });
      xPos += tableColumnWidth[i];
    });

    // Draw horizontal line
    doc.moveTo(30, tableTop + 20)
       .lineTo(30 + tableColumnWidth.reduce((a, b) => a + b, 0), tableTop + 20)
       .stroke();

    // Draw table rows
    doc.font('Helvetica').fontSize(9);
    
    let yPos = tableTop + 30;
    
    data.forEach((record, index) => {
      // Add new page if needed
      if (yPos > 750) {
        doc.addPage();
        yPos = 50;
        
        // Add page number
        doc.fontSize(8).text(`Page ${doc.page}`, 30, 800);
      }
      
      // Format date/time
      const dateTime = record.TrDateTime ? new Date(record.TrDateTime).toLocaleString() : '';
      
      // Draw row
      xPos = 30;
      doc.text(record.CardNo || '', xPos, yPos, { width: tableColumnWidth[0], align: 'left' });
      xPos += tableColumnWidth[0];
      
      doc.text(record.Name || '', xPos, yPos, { width: tableColumnWidth[1], align: 'left' });
      xPos += tableColumnWidth[1];
      
      doc.text(record.Department || '', xPos, yPos, { width: tableColumnWidth[2], align: 'left' });
      xPos += tableColumnWidth[2];
      
      doc.text(dateTime, xPos, yPos, { width: tableColumnWidth[3], align: 'left' });
      xPos += tableColumnWidth[3];
      
      doc.text(record.ClockEvent || '', xPos, yPos, { width: tableColumnWidth[4], align: 'left' });
      xPos += tableColumnWidth[4];
      
      doc.text(record.Status || '', xPos, yPos, { width: tableColumnWidth[5], align: 'left' });
      
      yPos += 20;
      
      // Add light gray background for alternate rows
      if (index % 2 === 1) {
        doc.rect(30, yPos - 18, tableColumnWidth.reduce((a, b) => a + b, 0), 18).fillAndStroke('#f2f2f2', '#f2f2f2');
      }
      
      // Add horizontal line after each row
      if (index < data.length - 1) {
        doc.moveTo(30, yPos - 2)
           .lineTo(30 + tableColumnWidth.reduce((a, b) => a + b, 0), yPos - 2)
           .stroke('#e5e5e5');
      }
    });

    // Add page number to the first page
    doc.fontSize(8).text(`Page 1`, 30, 800);
    
    // Add footer with generation timestamp
    const timestamp = new Date().toLocaleString();
    doc.fontSize(8).text(`Generated on: ${timestamp}`, 30, 810);

    // Finalize the PDF
    doc.end();
  } catch (err) {
    next(err);
  }
};
