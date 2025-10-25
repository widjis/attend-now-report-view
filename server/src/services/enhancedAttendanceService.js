
const { sql, poolPromise } = require('../config/db');
const { buildFilterConditions, buildBaseCTEQueries } = require('../utils/queryBuilder');

// Shared SELECT fragment to ensure consistent fields
const getSelectFragment = (toleranceMinutes = 15) => {
  const inTimeExpr = `CONVERT(TIME, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockInOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockIn AS DATETIME))))`;
  const outTimeExpr = `CONVERT(TIME, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockOutOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockOut AS DATETIME))))`;
  const classificationTolerance = Math.max(toleranceMinutes, 30);

  return `
  s.StaffNo,
  s.Name,
  s.Department,
  s.Description,
  -- Anchor both override and fallback schedules to TrDate using CAST to DATETIME
  COALESCE(
    DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockInOverride AS DATETIME)),
    DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockIn AS DATETIME))
  ) AS ScheduledClockIn,
  COALESCE(
    DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockOutOverride AS DATETIME)),
    DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockOut AS DATETIME))
  ) AS ScheduledClockOut,
  -- Derive ScheduleType using tolerant matching against common shift patterns
  CASE 
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('08:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('17:00:00' AS TIME))) <= ${classificationTolerance} THEN 'DayOff'
    -- Normal Site variants: 7-17, 8-18, 8-16
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('07:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('17:00:00' AS TIME))) <= ${classificationTolerance} THEN 'Normal_Site'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('08:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('18:00:00' AS TIME))) <= ${classificationTolerance} THEN 'Normal_Site'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('08:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('16:00:00' AS TIME))) <= ${classificationTolerance} THEN 'Normal_Site'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('07:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('15:00:00' AS TIME))) <= ${classificationTolerance} THEN 'ThreeShift_Morning'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('07:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('19:00:00' AS TIME))) <= ${classificationTolerance} THEN 'TwoShift_Day'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('19:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('07:00:00' AS TIME))) <= ${classificationTolerance} THEN 'TwoShift_Night'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('23:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('07:00:00' AS TIME))) <= ${classificationTolerance} THEN 'ThreeShift_Night'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('15:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('23:00:00' AS TIME))) <= ${classificationTolerance} THEN 'ThreeShift_Evening'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('15:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('07:00:00' AS TIME))) <= ${classificationTolerance} THEN 'Overnight_Other'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('16:00:00' AS TIME))) <= ${classificationTolerance} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('00:00:00' AS TIME))) <= ${classificationTolerance} THEN 'ThreeShift_Evening'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('15:00:00' AS TIME))) <= ${classificationTolerance + 30} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('03:00:00' AS TIME))) <= ${classificationTolerance + 30} THEN 'Evening_OT'
    WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('16:00:00' AS TIME))) <= ${classificationTolerance + 30} 
      AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('02:00:00' AS TIME))) <= ${classificationTolerance + 30} THEN 'Evening_OT'
    -- Generic overnight fallback classification when none matched but out < in (cross-midnight)
    WHEN (
      DATEDIFF(MINUTE,
        COALESCE(
          DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockInOverride AS DATETIME)),
          DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockIn AS DATETIME))
        ),
        COALESCE(
          DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockOutOverride AS DATETIME)),
          DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockOut AS DATETIME))
        )
      ) + CASE WHEN ${outTimeExpr} < ${inTimeExpr} THEN 1440 ELSE 0 END BETWEEN 900 AND 1020
    ) THEN 'Overnight_OT'
      WHEN ${outTimeExpr} < ${inTimeExpr} THEN 'Overnight_Other'
      ELSE 'Unknown'
    END AS ScheduleType,
  a.TrDate AS Date,
  a.ActualClockIn,
  a.ActualClockOut,
  a.ClockInController,
  a.ClockOutController,
  CASE 
    WHEN a.ActualClockIn IS NULL THEN 'Missing'
    WHEN DATEDIFF(MINUTE, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockInOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockIn AS DATETIME))), a.ActualClockIn) > ${toleranceMinutes} THEN 'Late'
    WHEN DATEDIFF(MINUTE, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockInOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockIn AS DATETIME))), a.ActualClockIn) < -${toleranceMinutes} THEN 'Early'
    ELSE 'OnTime'
  END AS ClockInStatus,
  CASE 
    WHEN a.ActualClockOut IS NULL THEN 'Missing'
    WHEN ABS(DATEDIFF(MINUTE, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockOutOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockOut AS DATETIME))), a.ActualClockOut)) > 120 THEN 'Out of Range'
    WHEN DATEDIFF(MINUTE, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockOutOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockOut AS DATETIME))), a.ActualClockOut) < -${toleranceMinutes} THEN 'Early'
    WHEN DATEDIFF(MINUTE, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockOutOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockOut AS DATETIME))), a.ActualClockOut) > ${toleranceMinutes} THEN 'Late'
    ELSE 'OnTime'
  END AS ClockOutStatus
`;
};

const getEnhancedAttendanceData = async ({ startDate, endDate, filters = {}, page = 1, limit = 50, toleranceMinutes = 15 }) => {
  const pool = await poolPromise;

  const { whereClause, queryParams } = buildFilterConditions({ ...filters, startDate, endDate }, toleranceMinutes);
  const baseCTE = buildBaseCTEQueries(toleranceMinutes);

  const offset = (page - 1) * limit;

  // Build additional WHERE conditions for computed fields
  let additionalWhereConditions = [];
  
  // Check if we need to filter by computed fields
  const scheduleTypeParam = queryParams.find(p => p.name === 'ScheduleType');
  const clockInStatusParam = queryParams.find(p => p.name === 'ClockInStatus');
  const clockOutStatusParam = queryParams.find(p => p.name === 'ClockOutStatus');
  
  if (scheduleTypeParam) {
    additionalWhereConditions.push(`ScheduleType = @ScheduleType`);
  }
  if (clockInStatusParam) {
    additionalWhereConditions.push(`ClockInStatus = @ClockInStatus`);
  }
  if (clockOutStatusParam) {
    additionalWhereConditions.push(`ClockOutStatus = @ClockOutStatus`);
  }

  const additionalWhereClause = additionalWhereConditions.length > 0 
    ? `WHERE ${additionalWhereConditions.join(' AND ')}` 
    : '';

  const countQuery = `
    ${baseCTE}
    ${additionalWhereConditions.length > 0 ? `
    , FilteredData AS (
      SELECT ${getSelectFragment(toleranceMinutes)}
      FROM ScheduleData s
      LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo
      ${whereClause}
    )
    SELECT COUNT(*) AS TotalCount
    FROM FilteredData
    ${additionalWhereClause}
    ` : `
    SELECT COUNT(*) AS TotalCount
    FROM ScheduleData s
    LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo
    ${whereClause}
    `}
  `;

  const dataQuery = `
    ${baseCTE}
    ${additionalWhereConditions.length > 0 ? `
    , FilteredData AS (
      SELECT ${getSelectFragment(toleranceMinutes)}
      FROM ScheduleData s
      LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo
      ${whereClause}
    )
    SELECT *
    FROM FilteredData
    ${additionalWhereClause}
    ORDER BY Date DESC, StaffNo ASC
    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
    ` : `
    SELECT ${getSelectFragment(toleranceMinutes)}
    FROM ScheduleData s
    LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo
    ${whereClause}
    ORDER BY a.TrDate DESC, s.StaffNo ASC
    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
    `}
  `;

  const request = pool.request();
  request.input('startDate', sql.DateTime, startDate);
  request.input('endDate', sql.DateTime, endDate);
  for (const p of queryParams.filter(p => p.name !== 'startDate' && p.name !== 'endDate')) {
    // Infer type based on param name; use NVARCHAR for strings by default
    const type = (p.name.toLowerCase().includes('date')) ? sql.DateTime : sql.NVarChar;
    request.input(p.name, type, p.value);
  }

  const totalCountResult = await request.query(countQuery);
  const totalCount = totalCountResult.recordset[0]?.TotalCount || 0;

  const dataResult = await request.query(dataQuery);
  const records = dataResult.recordset.map((row) => ({
    StaffNo: row.StaffNo,
    Name: row.Name,
    Department: row.Department,
    Description: row.Description,
    ScheduledClockIn: row.ScheduledClockIn,
    ScheduledClockOut: row.ScheduledClockOut,
    ScheduleType: row.ScheduleType,
    Date: row.Date,
    ActualClockIn: row.ActualClockIn,
    ActualClockOut: row.ActualClockOut,
    ClockInController: row.ClockInController,
    ClockOutController: row.ClockOutController,
    ClockInStatus: row.ClockInStatus,
    ClockOutStatus: row.ClockOutStatus
  }));

  return { records, totalCount };
};

const getEnhancedAttendanceForExport = async ({ startDate, endDate, filters = {}, toleranceMinutes = 15 }) => {
  const pool = await poolPromise;

  const { whereClause, queryParams } = buildFilterConditions({ ...filters, startDate, endDate }, toleranceMinutes);
  const baseCTE = buildBaseCTEQueries(toleranceMinutes);

  const exportQuery = `
    ${baseCTE}
    SELECT ${getSelectFragment(toleranceMinutes)}
    FROM ScheduleData s
    LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo
    ${whereClause}
    ORDER BY a.TrDate DESC, s.StaffNo ASC
  `;

  const request = pool.request();
  request.input('startDate', sql.DateTime, startDate);
  request.input('endDate', sql.DateTime, endDate);
  for (const p of queryParams.filter(p => p.name !== 'startDate' && p.name !== 'endDate')) {
    const type = (p.name.toLowerCase().includes('date')) ? sql.DateTime : sql.NVarChar;
    request.input(p.name, type, p.value);
  }

  const exportResult = await request.query(exportQuery);
  const records = exportResult.recordset.map((row) => ({
    StaffNo: row.StaffNo,
    Name: row.Name,
    Department: row.Department,
    Description: row.Description,
    ScheduledClockIn: row.ScheduledClockIn,
    ScheduledClockOut: row.ScheduledClockOut,
    ScheduleType: row.ScheduleType,
    Date: row.Date,
    ActualClockIn: row.ActualClockIn,
    ActualClockOut: row.ActualClockOut,
    ClockInController: row.ClockInController,
    ClockOutController: row.ClockOutController,
    ClockInStatus: row.ClockInStatus,
    ClockOutStatus: row.ClockOutStatus
  }));

  return records;
};

// New: get distinct users whose derived ScheduleType is Evening_OT within a date range
const getEveningOtUsers = async ({ startDate, endDate, toleranceMinutes = 15 }) => {
  const pool = await poolPromise;
  const baseCTE = buildBaseCTEQueries(toleranceMinutes);

  const inTimeExpr = `CONVERT(TIME, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockInOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockIn AS DATETIME))))`;
  const outTimeExpr = `CONVERT(TIME, COALESCE(DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(a.ScheduledClockOutOverride AS DATETIME)), DATEADD(DAY, DATEDIFF(DAY, 0, a.TrDate), CAST(s.ScheduledClockOut AS DATETIME))))`;
  const classificationTolerance = Math.max(toleranceMinutes, 30);

  // Build an inner SELECT with classification, then filter in the outer WHERE
  const query = `
    ${baseCTE}
    SELECT DISTINCT StaffNo, Name, Department, Description
    FROM (
      SELECT 
        s.StaffNo,
        s.Name,
        s.Department,
        s.Description,
        a.TrDate,
        CASE 
          WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('15:00:00' AS TIME))) <= ${classificationTolerance + 30} 
            AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('03:00:00' AS TIME))) <= ${classificationTolerance + 30} THEN 'Evening_OT'
          WHEN ABS(DATEDIFF(MINUTE, ${inTimeExpr}, CAST('16:00:00' AS TIME))) <= ${classificationTolerance + 30} 
            AND ABS(DATEDIFF(MINUTE, ${outTimeExpr}, CAST('02:00:00' AS TIME))) <= ${classificationTolerance + 30} THEN 'Evening_OT'
          ELSE 'Other'
        END AS ScheduleType
      FROM ScheduleData s
      LEFT JOIN AttendanceData a ON s.StaffNo = a.StaffNo
      WHERE a.TrDate BETWEEN @startDate AND @endDate
    ) t
    WHERE t.ScheduleType = 'Evening_OT'
    ORDER BY Name, StaffNo
  `;

  const request = pool.request();
  request.input('startDate', sql.DateTime, startDate);
  request.input('endDate', sql.DateTime, endDate);

  const result = await request.query(query);
  return result.recordset.map((row) => ({
    StaffNo: row.StaffNo,
    Name: row.Name,
    Department: row.Department,
    Description: row.Description,
  }));
};

module.exports = {
  getEnhancedAttendanceData,
  getEnhancedAttendanceForExport,
  getEveningOtUsers
};
