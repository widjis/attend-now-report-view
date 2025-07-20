const { poolPromise } = require('../config/db');
const { formatEmployeesData, formatEmployeeData } = require('../utils/timeFormatter');

/**
 * Updated Schedule Controller for MTIUsers table
 * This controller handles the migration from CardDBTimeSchedule to MTIUsers
 * and provides enhanced functionality with the new comprehensive schema
 */

// Get schedule data with filters and pagination using MTIUsers table
exports.getScheduleData = async (req, res, next) => {
  try {
    // Get query parameters for filtering and pagination
    const search = req.query.search || '';
    const department = req.query.department;
    const division = req.query.division;
    const section = req.query.section;
    const dayType = req.query.dayType;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const timeInStatus = req.query.timeInStatus;
    const timeOutStatus = req.query.timeOutStatus;
    const offset = (page - 1) * pageSize;
    
    // Build the base query for MTIUsers table
    let countQuery = `
      SELECT COUNT(*) AS total 
      FROM MTIUsers 
      WHERE 1=1 
        AND employee_id IS NOT NULL 
        AND employee_id <> ''
    `;
    
    let dataQuery = `
      SELECT 
        employee_id,
        employee_name,
        department,
        division,
        section,
        time_in,
        time_out,
        description,
        day_type,
        position_title,
        supervisor_name,
        phone,
        StaffNo,
        Name,
        CardNo
      FROM MTIUsers
      WHERE 1=1 
        AND employee_id IS NOT NULL 
        AND employee_id <> ''
    `;
    
    // Query to get statistics about TimeIn and TimeOut availability
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN time_in IS NOT NULL THEN 1 ELSE 0 END) as timeInAvailable,
        SUM(CASE WHEN time_in IS NULL THEN 1 ELSE 0 END) as timeInUnavailable,
        SUM(CASE WHEN time_out IS NOT NULL THEN 1 ELSE 0 END) as timeOutAvailable,
        SUM(CASE WHEN time_out IS NULL THEN 1 ELSE 0 END) as timeOutUnavailable,
        COUNT(DISTINCT department) as totalDepartments,
        COUNT(DISTINCT division) as totalDivisions,
        COUNT(DISTINCT section) as totalSections,
        COUNT(DISTINCT day_type) as totalDayTypes
      FROM MTIUsers
      WHERE 1=1 
        AND employee_id IS NOT NULL 
        AND employee_id <> ''
    `;
    
    const queryParams = [];
    
    // Add search filter if provided (search across multiple fields)
    if (search) {
      const searchCondition = ` AND (
        employee_id LIKE @search 
        OR employee_name LIKE @search 
        OR StaffNo LIKE @search 
        OR Name LIKE @search
        OR department LIKE @search
        OR position_title LIKE @search
      )`;
      countQuery += searchCondition;
      dataQuery += searchCondition;
      queryParams.push({ name: 'search', value: `%${search}%` });
    }
    
    // Add department filter if provided
    if (department && department !== 'all') {
      countQuery += ` AND department = @department`;
      dataQuery += ` AND department = @department`;
      queryParams.push({ name: 'department', value: department });
    }
    
    // Add division filter if provided
    if (division && division !== 'all') {
      countQuery += ` AND division = @division`;
      dataQuery += ` AND division = @division`;
      queryParams.push({ name: 'division', value: division });
    }
    
    // Add section filter if provided
    if (section && section !== 'all') {
      countQuery += ` AND section = @section`;
      dataQuery += ` AND section = @section`;
      queryParams.push({ name: 'section', value: section });
    }
    
    // Add day type filter if provided
    if (dayType && dayType !== 'all') {
      countQuery += ` AND day_type = @dayType`;
      dataQuery += ` AND day_type = @dayType`;
      queryParams.push({ name: 'dayType', value: dayType });
    }
    
    // Add TimeIn status filter if provided
    if (timeInStatus && timeInStatus !== 'all') {
      if (timeInStatus === 'available') {
        countQuery += ` AND time_in IS NOT NULL`;
        dataQuery += ` AND time_in IS NOT NULL`;
      } else if (timeInStatus === 'unavailable') {
        countQuery += ` AND time_in IS NULL`;
        dataQuery += ` AND time_in IS NULL`;
      }
    }
    
    // Add TimeOut status filter if provided
    if (timeOutStatus && timeOutStatus !== 'all') {
      if (timeOutStatus === 'available') {
        countQuery += ` AND time_out IS NOT NULL`;
        dataQuery += ` AND time_out IS NOT NULL`;
      } else if (timeOutStatus === 'unavailable') {
        countQuery += ` AND time_out IS NULL`;
        dataQuery += ` AND time_out IS NULL`;
      }
    }
    
    // Add pagination and ordering
    dataQuery += ` ORDER BY employee_name, employee_id OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
    
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
    const stats = statsResult.recordset[0];
    
    res.json({
      data: formatEmployeesData(dataResult.recordset),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      timeInStats: {
        available: parseInt(stats.timeInAvailable) || 0,
        unavailable: parseInt(stats.timeInUnavailable) || 0
      },
      timeOutStats: {
        available: parseInt(stats.timeOutAvailable) || 0,
        unavailable: parseInt(stats.timeOutUnavailable) || 0
      },
      organizationStats: {
        totalDepartments: parseInt(stats.totalDepartments) || 0,
        totalDivisions: parseInt(stats.totalDivisions) || 0,
        totalSections: parseInt(stats.totalSections) || 0,
        totalDayTypes: parseInt(stats.totalDayTypes) || 0
      }
    });
    
  } catch (err) {
    console.error('Error fetching schedule data:', err);
    next(err);
  }
};

// Get filter options for the new MTIUsers table
exports.getFilterOptions = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    // Get unique departments
    const departmentsQuery = `
      SELECT DISTINCT department 
      FROM MTIUsers 
      WHERE department IS NOT NULL AND department <> ''
      ORDER BY department
    `;
    
    // Get unique divisions
    const divisionsQuery = `
      SELECT DISTINCT division 
      FROM MTIUsers 
      WHERE division IS NOT NULL AND division <> ''
      ORDER BY division
    `;
    
    // Get unique sections
    const sectionsQuery = `
      SELECT DISTINCT section 
      FROM MTIUsers 
      WHERE section IS NOT NULL AND section <> ''
      ORDER BY section
    `;
    
    // Get unique day types
    const dayTypesQuery = `
      SELECT DISTINCT day_type 
      FROM MTIUsers 
      WHERE day_type IS NOT NULL AND day_type <> ''
      ORDER BY day_type
    `;
    
    // Execute all queries
    const [departmentsResult, divisionsResult, sectionsResult, dayTypesResult] = await Promise.all([
      pool.request().query(departmentsQuery),
      pool.request().query(divisionsQuery),
      pool.request().query(sectionsQuery),
      pool.request().query(dayTypesQuery)
    ]);
    
    res.json({
      departments: departmentsResult.recordset.map(row => row.department),
      divisions: divisionsResult.recordset.map(row => row.division),
      sections: sectionsResult.recordset.map(row => row.section),
      dayTypes: dayTypesResult.recordset.map(row => row.day_type)
    });
    
  } catch (err) {
    console.error('Error fetching filter options:', err);
    next(err);
  }
};

// Get employee details by ID
exports.getEmployeeDetails = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    const pool = await poolPromise;
    const request = pool.request();
    
    const query = `
      SELECT 
        employee_id,
        employee_name,
        gender,
        division,
        department,
        section,
        supervisor_id,
        supervisor_name,
        position_title,
        grade_interval,
        phone,
        day_type,
        description,
        time_in,
        time_out,
        next_day,
        CardNo,
        AccessLevel,
        Name,
        FirstName,
        LastName,
        StaffNo
      FROM MTIUsers
      WHERE employee_id = @employeeId
    `;
    
    request.input('employeeId', employeeId);
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(formatEmployeeData(result.recordset[0]));
    
  } catch (err) {
    console.error('Error fetching employee details:', err);
    next(err);
  }
};

// Get organization hierarchy
exports.getOrganizationHierarchy = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    const query = `
      SELECT 
        division,
        department,
        section,
        COUNT(*) as employee_count,
        COUNT(CASE WHEN time_in IS NOT NULL THEN 1 END) as employees_with_schedule
      FROM MTIUsers
      WHERE employee_id IS NOT NULL AND employee_id <> ''
      GROUP BY division, department, section
      ORDER BY division, department, section
    `;
    
    const result = await pool.request().query(query);
    
    // Organize data into hierarchy
    const hierarchy = {};
    
    result.recordset.forEach(row => {
      const { division, department, section, employee_count, employees_with_schedule } = row;
      
      if (!hierarchy[division]) {
        hierarchy[division] = {
          name: division,
          departments: {},
          totalEmployees: 0,
          totalWithSchedule: 0
        };
      }
      
      if (!hierarchy[division].departments[department]) {
        hierarchy[division].departments[department] = {
          name: department,
          sections: {},
          totalEmployees: 0,
          totalWithSchedule: 0
        };
      }
      
      hierarchy[division].departments[department].sections[section] = {
        name: section,
        employeeCount: employee_count,
        employeesWithSchedule: employees_with_schedule
      };
      
      // Update totals
      hierarchy[division].departments[department].totalEmployees += employee_count;
      hierarchy[division].departments[department].totalWithSchedule += employees_with_schedule;
      hierarchy[division].totalEmployees += employee_count;
      hierarchy[division].totalWithSchedule += employees_with_schedule;
    });
    
    res.json(hierarchy);
    
  } catch (err) {
    console.error('Error fetching organization hierarchy:', err);
    next(err);
  }
};

// Legacy compatibility function for old CardDBTimeSchedule queries
exports.getScheduleDataLegacy = async (req, res, next) => {
  try {
    console.warn('Using legacy CardDBTimeSchedule endpoint - consider migrating to MTIUsers');
    
    // Get query parameters for filtering and pagination
    const search = req.query.search || '';
    const department = req.query.department;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const timeInStatus = req.query.timeInStatus;
    const timeOutStatus = req.query.timeOutStatus;
    const offset = (page - 1) * pageSize;
    
    // Build the base query for legacy table
    let countQuery = `SELECT COUNT(*) AS total FROM CardDBTimeSchedule WHERE 1=1 AND StaffNo IS NOT NULL AND StaffNo <> '' AND StaffNo LIKE '%MTI%'`;
    let dataQuery = `
      SELECT 
        StaffNo as employee_id,
        Name as employee_name,
        TimeIn as time_in,
        TimeOut as time_out,
        Email,
        Department as department,
        '' as description
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
    
    res.json({
      data: formatEmployeesData(dataResult.recordset),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      legacy: true,
      message: 'This endpoint uses legacy CardDBTimeSchedule table. Consider migrating to MTIUsers.'
    });
    
  } catch (err) {
    console.error('Error fetching legacy schedule data:', err);
    next(err);
  }
};