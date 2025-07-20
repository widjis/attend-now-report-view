
const { poolPromise } = require('../config/db');
const { buildFilterConditions, buildBaseCTEQueries } = require('../utils/queryBuilder');
const { formatTime } = require('../utils/dateTimeFormatter');

// Helper function to format time fields in attendance data
const formatAttendanceData = (data) => {
  return data.map(row => ({
    ...row,
    Date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
    // Format scheduled times to HH:MM to match frontend display
    ScheduledClockIn: row.ScheduledClockIn ? formatTime(new Date(row.ScheduledClockIn)) : '',
    ScheduledClockOut: row.ScheduledClockOut ? formatTime(new Date(row.ScheduledClockOut)) : '',
    // Format actual times to HH:MM to match frontend display
    ActualClockIn: row.ActualClockIn ? formatTime(new Date(row.ActualClockIn)) : '',
    ActualClockOut: row.ActualClockOut ? formatTime(new Date(row.ActualClockOut)) : ''
  }));
};

// Get enhanced attendance data with filters and pagination
const getEnhancedAttendanceData = async (filters) => {
  const toleranceMinutes = 15;
  const { whereClause, queryParams } = buildFilterConditions(filters, toleranceMinutes);
  const baseCTE = buildBaseCTEQueries(toleranceMinutes);
  
  const pool = await poolPromise;
  const { page, pageSize } = filters;
  const offset = (page - 1) * pageSize;
  
  // Count query with filters
  const countQuery = `
    ${baseCTE}
    ,
    FilteredData AS (
      SELECT 
        s.StaffNo AS StaffNo,
        s.Name AS Name,
        s.Department AS Department,
        COALESCE(a.Position, 'N/A') AS Position,
        COALESCE(a.TrDate, CAST(@startDate AS DATE)) AS Date,
        s.ScheduledClockIn,
        s.ScheduledClockOut,
        s.ScheduleType,
        a.ActualClockIn,
        a.ActualClockOut,
        a.ClockInController,
        a.ClockOutController
      FROM ScheduleData s
      LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo AND a.TrDate BETWEEN @startDate AND @endDate
      ${whereClause}
    )
    SELECT COUNT(*) AS total FROM FilteredData
  `;
  
  // Data query with filters and pagination
  const dataQuery = `
    ${baseCTE}
    ,
    FilteredData AS (
      SELECT 
        s.StaffNo AS StaffNo,
        s.Name AS Name,
        s.Department AS Department,
        COALESCE(a.Position, 'N/A') AS Position,
        COALESCE(a.TrDate, CAST(@startDate AS DATE)) AS Date,
        s.ScheduledClockIn,
        s.ScheduledClockOut,
        s.ScheduleType,
        a.ActualClockIn,
        a.ActualClockOut,
        a.ClockInController,
        a.ClockOutController,
        CASE
          WHEN a.ActualClockIn IS NULL THEN 'Missing'
          WHEN DATEPART(HOUR, a.ActualClockIn) < DATEPART(HOUR, s.ScheduledClockIn) THEN 'Early'
          WHEN DATEPART(HOUR, a.ActualClockIn) = DATEPART(HOUR, s.ScheduledClockIn) 
            AND DATEPART(MINUTE, a.ActualClockIn) <= DATEPART(MINUTE, s.ScheduledClockIn) + ${toleranceMinutes} THEN 'OnTime'
          ELSE 'Late'
        END AS ClockInStatus,
        CASE
          WHEN a.ActualClockOut IS NULL THEN 'Missing'
          -- Late: After scheduled time
          WHEN DATEPART(HOUR, a.ActualClockOut) > DATEPART(HOUR, s.ScheduledClockOut) THEN 'Late'
          -- OnTime: Within tolerance window (15 minutes before to any time after)
          WHEN DATEPART(HOUR, a.ActualClockOut) = DATEPART(HOUR, s.ScheduledClockOut) 
            AND DATEPART(MINUTE, a.ActualClockOut) >= DATEPART(MINUTE, s.ScheduledClockOut) - ${toleranceMinutes} THEN 'OnTime'
          -- Out of Range: More than 2 hours early (severe violation)
          WHEN a.ActualClockOut IS NOT NULL AND DATEDIFF(MINUTE, a.ActualClockOut, s.ScheduledClockOut) > 120 THEN 'Out of Range'
          -- Early: Within 2 hours but outside tolerance
          ELSE 'Early'
        END AS ClockOutStatus
      FROM ScheduleData s
      LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo AND a.TrDate BETWEEN @startDate AND @endDate
      ${whereClause}
    )
    SELECT * FROM FilteredData
    ORDER BY Date DESC, Name
    OFFSET ${offset} ROWS
    FETCH NEXT ${pageSize} ROWS ONLY
  `;
  
  // Execute the count query
  let request = pool.request();
  queryParams.forEach(param => {
    request = request.input(param.name, param.value);
  });
  
  const countResult = await request.query(countQuery);
  const total = countResult.recordset[0].total;
  
  // Reset request for data query
  request = pool.request();
  queryParams.forEach(param => {
    request = request.input(param.name, param.value);
  });
  
  // Execute the data query
  const dataResult = await request.query(dataQuery);
  
  // Format the time fields before returning
  const formattedData = formatAttendanceData(dataResult.recordset);
  
  console.log('Service returned data sample:', JSON.stringify(formattedData.slice(0, 2), null, 2));
  
  return {
    data: formattedData,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / pageSize)
  };
};

// Get enhanced attendance data for export (no pagination)
const getEnhancedAttendanceForExport = async (filters) => {
  console.log('Export service called with filters:', filters);
  
  const toleranceMinutes = 15;
  const { whereClause, queryParams } = buildFilterConditions(filters, toleranceMinutes);
  const baseCTE = buildBaseCTEQueries(toleranceMinutes);
  
  const pool = await poolPromise;
  
  // Use the same query structure as getEnhancedAttendanceData but without pagination
  const dataQuery = `
    ${baseCTE}
    ,
    FilteredData AS (
      SELECT 
        s.StaffNo AS StaffNo,
        s.Name AS Name,
        s.Department AS Department,
        COALESCE(a.Position, 'N/A') AS Position,
        COALESCE(a.TrDate, CAST(@startDate AS DATE)) AS Date,
        s.ScheduledClockIn,
        s.ScheduledClockOut,
        s.ScheduleType,
        a.ActualClockIn,
        a.ActualClockOut,
        a.ClockInController,
        a.ClockOutController,
        CASE
          WHEN a.ActualClockIn IS NULL THEN 'Missing'
          WHEN DATEPART(HOUR, a.ActualClockIn) < DATEPART(HOUR, s.ScheduledClockIn) THEN 'Early'
          WHEN DATEPART(HOUR, a.ActualClockIn) = DATEPART(HOUR, s.ScheduledClockIn) 
            AND DATEPART(MINUTE, a.ActualClockIn) <= DATEPART(MINUTE, s.ScheduledClockIn) + ${toleranceMinutes} THEN 'OnTime'
          ELSE 'Late'
        END AS ClockInStatus,
        CASE
          WHEN a.ActualClockOut IS NULL THEN 'Missing'
          -- Late: After scheduled time
          WHEN DATEPART(HOUR, a.ActualClockOut) > DATEPART(HOUR, s.ScheduledClockOut) THEN 'Late'
          -- OnTime: Within tolerance window (15 minutes before to any time after)
          WHEN DATEPART(HOUR, a.ActualClockOut) = DATEPART(HOUR, s.ScheduledClockOut) 
            AND DATEPART(MINUTE, a.ActualClockOut) >= DATEPART(MINUTE, s.ScheduledClockOut) - ${toleranceMinutes} THEN 'OnTime'
          -- Out of Range: More than 2 hours early (severe violation)
          WHEN a.ActualClockOut IS NOT NULL AND DATEDIFF(MINUTE, a.ActualClockOut, s.ScheduledClockOut) > 120 THEN 'Out of Range'
          -- Early: Within 2 hours but outside tolerance
          ELSE 'Early'
        END AS ClockOutStatus
      FROM ScheduleData s
      LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo AND a.TrDate BETWEEN @startDate AND @endDate
      ${whereClause}
    )
    SELECT * FROM FilteredData
    ORDER BY Date DESC, Name
  `;
  
  let request = pool.request();
  queryParams.forEach(param => {
    request = request.input(param.name, param.value);
  });
  
  console.log('Executing export query...');
  const dataResult = await request.query(dataQuery);
  
  // Format the time fields before returning
  const formattedData = formatAttendanceData(dataResult.recordset);
  
  console.log('Export service raw result sample:', JSON.stringify(formattedData.slice(0, 2), null, 2));
  
  return formattedData;
};

module.exports = {
  getEnhancedAttendanceData,
  getEnhancedAttendanceForExport
};
