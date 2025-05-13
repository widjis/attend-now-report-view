
const { poolPromise, sql } = require('../config/db');

// Get attendance data with pagination and filters
exports.getAttendanceData = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      search = '',
      department,
      company,
      cardType,
      page = 1,
      pageSize = 10
    } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const pool = await poolPromise;
    
    // Build conditions for WHERE clause
    const conditions = [];
    const parameters = [];
    let paramIndex = 1;

    conditions.push(`TrDate BETWEEN @p${paramIndex++} AND @p${paramIndex++}`);
    parameters.push(startDate, endDate);

    if (search) {
      conditions.push(`(
        Name LIKE @p${paramIndex} 
        OR StaffNo LIKE @p${paramIndex} 
        OR CardNo LIKE @p${paramIndex}
      )`);
      parameters.push(`%${search}%`);
      paramIndex++;
    }

    if (department) {
      conditions.push(`Department = @p${paramIndex++}`);
      parameters.push(department);
    }

    if (company) {
      conditions.push(`Company = @p${paramIndex++}`);
      parameters.push(company);
    }

    if (cardType) {
      conditions.push(`CardType = @p${paramIndex++}`);
      parameters.push(cardType);
    }

    // Build the WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Calculate pagination parameters
    const offset = (page - 1) * pageSize;
    
    // Query for total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM AttendanceRecords
      ${whereClause}
    `;

    // Create request for count
    const countRequest = pool.request();
    
    // Add parameters for count query
    parameters.forEach((param, index) => {
      countRequest.input(`p${index + 1}`, param);
    });
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    // Query for paginated data
    const dataQuery = `
      SELECT *
      FROM AttendanceRecords
      ${whereClause}
      ORDER BY TrDateTime DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;

    // Create request for data
    const dataRequest = pool.request();
    
    // Add parameters for data query
    parameters.forEach((param, index) => {
      dataRequest.input(`p${index + 1}`, param);
    });
    
    const dataResult = await dataRequest.query(dataQuery);
    
    // Return formatted response
    res.json({
      data: dataResult.recordset,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    next(err);
  }
};

// Get attendance summary for dashboard
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const pool = await poolPromise;
    
    // Overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) AS totalRecords,
        SUM(CASE WHEN ClockEvent = 'Clock In' THEN 1 ELSE 0 END) AS totalClockIn,
        SUM(CASE WHEN ClockEvent = 'Clock Out' THEN 1 ELSE 0 END) AS totalClockOut,
        SUM(CASE WHEN Processed = 1 THEN 1 ELSE 0 END) AS validRecords,
        SUM(CASE WHEN Processed = 0 THEN 1 ELSE 0 END) AS invalidRecords
      FROM AttendanceRecords
      WHERE TrDate BETWEEN @startDate AND @endDate
    `;

    const statsResult = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(statsQuery);

    // By date
    const byDateQuery = `
      SELECT 
        TrDate as date,
        SUM(CASE WHEN ClockEvent = 'Clock In' THEN 1 ELSE 0 END) AS clockIn,
        SUM(CASE WHEN ClockEvent = 'Clock Out' THEN 1 ELSE 0 END) AS clockOut,
        COUNT(*) AS total
      FROM AttendanceRecords
      WHERE TrDate BETWEEN @startDate AND @endDate
      GROUP BY TrDate
      ORDER BY TrDate
    `;

    const byDateResult = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(byDateQuery);

    // By status
    const byStatusQuery = `
      SELECT 
        CASE 
          WHEN Processed = 1 THEN 'Valid' 
          WHEN Processed = 0 THEN 'Invalid' 
          ELSE 'Unknown' 
        END as status,
        COUNT(*) AS count
      FROM AttendanceRecords
      WHERE TrDate BETWEEN @startDate AND @endDate
      GROUP BY Processed
    `;

    const byStatusResult = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(byStatusQuery);

    // By controller
    const byControllerQuery = `
      SELECT 
        TrController as controller,
        SUM(CASE WHEN Processed = 1 THEN 1 ELSE 0 END) AS valid,
        SUM(CASE WHEN Processed = 0 THEN 1 ELSE 0 END) AS invalid,
        COUNT(*) AS total
      FROM AttendanceRecords
      WHERE TrDate BETWEEN @startDate AND @endDate
      GROUP BY TrController
      ORDER BY total DESC
    `;

    const byControllerResult = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(byControllerQuery);

    // Get metrics from result
    const stats = statsResult.recordset[0];
    const totalRecords = stats.totalRecords || 0;
    const validRecords = stats.validRecords || 0;
    const invalidRecords = stats.invalidRecords || 0;

    // Calculate percentages
    const validPercentage = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;
    const invalidPercentage = totalRecords > 0 ? (invalidRecords / totalRecords) * 100 : 0;

    // Format the response
    res.json({
      totalRecords,
      totalClockIn: stats.totalClockIn || 0,
      totalClockOut: stats.totalClockOut || 0,
      validRecords,
      invalidRecords,
      validPercentage,
      invalidPercentage,
      byDate: byDateResult.recordset,
      byStatus: byStatusResult.recordset,
      byController: byControllerResult.recordset
    });
  } catch (err) {
    next(err);
  }
};
