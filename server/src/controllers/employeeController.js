
const { poolPromise, sql } = require('../config/db');

// Get employee schedule data with pagination and filters
exports.getEmployeeSchedule = async (req, res, next) => {
  try {
    const {
      search = '',
      department,
      company,
      page = 1,
      pageSize = 10
    } = req.query;

    const pool = await poolPromise;
    
    // Build conditions for WHERE clause
    const conditions = ['c.Del_State = 0']; // Only include non-deleted employees
    const parameters = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(
        c.Name LIKE @p${paramIndex} 
        OR c.StaffNo LIKE @p${paramIndex} 
        OR c.Department LIKE @p${paramIndex}
      )`);
      parameters.push(`%${search}%`);
      paramIndex++;
    }

    if (department) {
      conditions.push(`c.Department = @p${paramIndex++}`);
      parameters.push(department);
    }

    if (company) {
      conditions.push(`c.Company = @p${paramIndex++}`);
      parameters.push(company);
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
      FROM CardDB c
      LEFT JOIN CardDBTimeSchedule ts ON c.StaffNo = ts.StaffNo
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
      SELECT 
        c.StaffNo as staffNo,
        c.Name as name,
        c.Position as position,
        c.Department as department,
        c.Company as company,
        ts.TimeIn as timeIn,
        ts.TimeOut as timeOut
      FROM CardDB c
      LEFT JOIN CardDBTimeSchedule ts ON c.StaffNo = ts.StaffNo
      ${whereClause}
      ORDER BY c.Name
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
