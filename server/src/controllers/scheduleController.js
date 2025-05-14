
const { poolPromise } = require('../config/db');

// Get schedule data with filters and pagination
exports.getScheduleData = async (req, res, next) => {
  try {
    // Get query parameters for filtering and pagination
    const search = req.query.search || '';
    const department = req.query.department;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const timeInStatus = req.query.timeInStatus;
    const timeOutStatus = req.query.timeOutStatus;
    const offset = (page - 1) * pageSize;
    
    // Build the base query
    let countQuery = `SELECT COUNT(*) AS total FROM CardDBTimeSchedule WHERE 1=1 AND StaffNo IS NOT NULL AND StaffNo <> '' AND StaffNo LIKE '%MTI%'`;
    let dataQuery = `
      SELECT 
        StaffNo,
        Name,
        TimeIn,
        TimeOut,
        Email,
        Department
      FROM CardDBTimeSchedule
      WHERE 1=1 AND StaffNo IS NOT NULL AND StaffNo <> '' AND StaffNo LIKE '%MTI%'
    `;
    
    // Query to get statistics about TimeIn and TimeOut availability
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN TimeIn IS NOT NULL THEN 1 ELSE 0 END) as timeInAvailable,
        SUM(CASE WHEN TimeIn IS NULL THEN 1 ELSE 0 END) as timeInUnavailable,
        SUM(CASE WHEN TimeOut IS NOT NULL THEN 1 ELSE 0 END) as timeOutAvailable,
        SUM(CASE WHEN TimeOut IS NULL THEN 1 ELSE 0 END) as timeOutUnavailable
      FROM CardDBTimeSchedule
      WHERE 1=1 AND StaffNo IS NOT NULL AND StaffNo <> '' AND StaffNo LIKE '%MTI%'
    `;
    
    const queryParams = [];
    
    // Add search filter if provided
    if (search) {
      countQuery += ` AND (StaffNo LIKE @search OR Name LIKE @search)`;
      dataQuery += ` AND (StaffNo LIKE @search OR Name LIKE @search)`;
      queryParams.push({ name: 'search', value: `%${search}%` });
    }
    
    // Add department filter if provided
    if (department && department !== 'all') {
      countQuery += ` AND Department = @department`;
      dataQuery += ` AND Department = @department`;
      queryParams.push({ name: 'department', value: department });
    }
    
    // Add TimeIn status filter if provided
    if (timeInStatus && timeInStatus !== 'all') {
      if (timeInStatus === 'available') {
        countQuery += ` AND TimeIn IS NOT NULL`;
        dataQuery += ` AND TimeIn IS NOT NULL`;
      } else if (timeInStatus === 'unavailable') {
        countQuery += ` AND TimeIn IS NULL`;
        dataQuery += ` AND TimeIn IS NULL`;
      }
    }
    
    // Add TimeOut status filter if provided
    if (timeOutStatus && timeOutStatus !== 'all') {
      if (timeOutStatus === 'available') {
        countQuery += ` AND TimeOut IS NOT NULL`;
        dataQuery += ` AND TimeOut IS NOT NULL`;
      } else if (timeOutStatus === 'unavailable') {
        countQuery += ` AND TimeOut IS NULL`;
        dataQuery += ` AND TimeOut IS NULL`;
      }
    }
    
    // Add pagination
    dataQuery += ` ORDER BY StaffNo OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
    
    // Execute the queries
    const pool = await poolPromise;
    let request = pool.request();
    
    // Add parameters to the request
    queryParams.forEach(param => {
      request = request.input(param.name, param.value);
    });
    
    // Get total count
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;
    
    // Reset request for data query
    request = pool.request();
    queryParams.forEach(param => {
      request = request.input(param.name, param.value);
    });
    
    // Get data with pagination
    const dataResult = await request.query(dataQuery);
    
    // Get statistics
    request = pool.request();
    queryParams.forEach(param => {
      request = request.input(param.name, param.value);
    });
    const statsResult = await request.query(statsQuery);
    
    res.json({
      data: dataResult.recordset,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      timeInStats: {
        available: parseInt(statsResult.recordset[0].timeInAvailable) || 0,
        unavailable: parseInt(statsResult.recordset[0].timeInUnavailable) || 0
      },
      timeOutStats: {
        available: parseInt(statsResult.recordset[0].timeOutAvailable) || 0,
        unavailable: parseInt(statsResult.recordset[0].timeOutUnavailable) || 0
      }
    });
    
  } catch (err) {
    console.error('Error fetching schedule data:', err);
    next(err);
  }
};
