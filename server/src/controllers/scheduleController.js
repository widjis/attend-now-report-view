
const { poolPromise } = require('../config/db');

// Get schedule data with filters and pagination
exports.getScheduleData = async (req, res, next) => {
  try {
    // Get query parameters for filtering and pagination
    const search = req.query.search || '';
    const department = req.query.department;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // Build the base query
    let countQuery = `SELECT COUNT(*) AS total FROM CardDBTimeSchedule WHERE 1=1`;
    let dataQuery = `
      SELECT 
        StaffNo,
        Name,
        TimeIn,
        TimeOut,
        Email,
        Department
      FROM CardDBTimeSchedule
      WHERE 1=1
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
    
    res.json({
      data: dataResult.recordset,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
    
  } catch (err) {
    console.error('Error fetching schedule data:', err);
    next(err);
  }
};
