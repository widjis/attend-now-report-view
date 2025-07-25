
const { poolPromise } = require('../config/db');
const { buildFilterConditions, buildBaseCTEQueries } = require('../utils/queryBuilder');

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
        s.StaffNo,
        s.Name,
        s.Department,
        a.Position,
        a.TrDate AS Date,
        s.ScheduledClockIn,
        s.ScheduledClockOut,
        s.ScheduleType,
        a.ActualClockIn,
        a.ActualClockOut,
        a.ClockInController,
        a.ClockOutController
      FROM ScheduleData s
      JOIN AttendanceData a ON s.StaffNo = a.StaffNo
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
        s.StaffNo,
        s.Name,
        s.Department,
        a.Position,
        a.TrDate AS Date,
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
          WHEN DATEPART(HOUR, a.ActualClockOut) > DATEPART(HOUR, s.ScheduledClockOut) THEN 'Late'
          WHEN DATEPART(HOUR, a.ActualClockOut) = DATEPART(HOUR, s.ScheduledClockOut) 
            AND DATEPART(MINUTE, a.ActualClockOut) >= DATEPART(MINUTE, s.ScheduledClockOut) - ${toleranceMinutes} THEN 'OnTime'
          ELSE 'Early'
        END AS ClockOutStatus
      FROM ScheduleData s
      JOIN AttendanceData a ON s.StaffNo = a.StaffNo
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
  
  console.log('Service returned data sample:', JSON.stringify(dataResult.recordset.slice(0, 2), null, 2));
  
  return {
    data: dataResult.recordset,
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
        s.StaffNo,
        s.Name,
        s.Department,
        a.Position,
        a.TrDate AS Date,
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
          WHEN DATEPART(HOUR, a.ActualClockOut) > DATEPART(HOUR, s.ScheduledClockOut) THEN 'Late'
          WHEN DATEPART(HOUR, a.ActualClockOut) = DATEPART(HOUR, s.ScheduledClockOut) 
            AND DATEPART(MINUTE, a.ActualClockOut) >= DATEPART(MINUTE, s.ScheduledClockOut) - ${toleranceMinutes} THEN 'OnTime'
          ELSE 'Early'
        END AS ClockOutStatus
      FROM ScheduleData s
      JOIN AttendanceData a ON s.StaffNo = a.StaffNo
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
  console.log('Export service raw result sample:', JSON.stringify(dataResult.recordset.slice(0, 2), null, 2));
  
  return dataResult.recordset;
};

module.exports = {
  getEnhancedAttendanceData,
  getEnhancedAttendanceForExport
};
