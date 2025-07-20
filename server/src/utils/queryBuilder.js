
// Build filter conditions for enhanced attendance queries
const buildFilterConditions = (filters, toleranceMinutes = 15) => {
  const { search, department, scheduleType, clockInStatus, clockOutStatus } = filters;
  let filterConditions = [];
  const queryParams = [
    { name: 'startDate', value: filters.startDate },
    { name: 'endDate', value: filters.endDate }
  ];
  
  // Helper function to check if a value is valid (not null, undefined, empty string, or literal "undefined")
  const isValidValue = (value) => {
    return value && 
           value !== 'undefined' && 
           value !== 'null' && 
           value !== '' && 
           value.toString().trim() !== '';
  };
  
  // Add search filter if provided
  if (isValidValue(search)) {
    filterConditions.push(`(s.StaffNo LIKE @search OR s.Name LIKE @search)`);
    queryParams.push({ name: 'search', value: `%${search}%` });
  }
  
  // Add department filter if provided
  if (isValidValue(department) && department !== 'all') {
    filterConditions.push(`s.Department = @department`);
    queryParams.push({ name: 'department', value: department });
  }
  
  // Add schedule type filter if provided
  if (isValidValue(scheduleType) && scheduleType !== 'All') {
    filterConditions.push(`s.ScheduleType = @scheduleType`);
    queryParams.push({ name: 'scheduleType', value: scheduleType });
  }
  
  // Add clock in status filter if provided
  if (isValidValue(clockInStatus) && clockInStatus !== 'All') {
    if (clockInStatus === 'Missing') {
      filterConditions.push(`a.ActualClockIn IS NULL`);
    } else if (clockInStatus === 'Early') {
      filterConditions.push(`(DATEPART(HOUR, a.ActualClockIn) < DATEPART(HOUR, s.ScheduledClockIn))`);
    } else if (clockInStatus === 'Late') {
      filterConditions.push(`(DATEPART(HOUR, a.ActualClockIn) > DATEPART(HOUR, s.ScheduledClockIn) 
        OR (DATEPART(HOUR, a.ActualClockIn) = DATEPART(HOUR, s.ScheduledClockIn) 
        AND DATEPART(MINUTE, a.ActualClockIn) > DATEPART(MINUTE, s.ScheduledClockIn) + ${toleranceMinutes}))`);
    } else if (clockInStatus === 'OnTime') {
      filterConditions.push(`(DATEPART(HOUR, a.ActualClockIn) = DATEPART(HOUR, s.ScheduledClockIn) 
        AND DATEPART(MINUTE, a.ActualClockIn) <= DATEPART(MINUTE, s.ScheduledClockIn) + ${toleranceMinutes})`);
    }
  }
  
  // Add clock out status filter if provided
  if (isValidValue(clockOutStatus) && clockOutStatus !== 'All') {
    if (clockOutStatus === 'Missing') {
      filterConditions.push(`a.ActualClockOut IS NULL`);
    } else if (clockOutStatus === 'Out of Range') {
      filterConditions.push(`(a.ActualClockOut IS NOT NULL AND DATEDIFF(MINUTE, a.ActualClockOut, s.ScheduledClockOut) > 120)`);
    } else if (clockOutStatus === 'Early') {
      filterConditions.push(`(a.ActualClockOut IS NOT NULL AND 
        DATEDIFF(MINUTE, a.ActualClockOut, s.ScheduledClockOut) <= 120 AND
        (DATEPART(HOUR, a.ActualClockOut) < DATEPART(HOUR, s.ScheduledClockOut) 
        OR (DATEPART(HOUR, a.ActualClockOut) = DATEPART(HOUR, s.ScheduledClockOut) 
        AND DATEPART(MINUTE, a.ActualClockOut) < DATEPART(MINUTE, s.ScheduledClockOut) - ${toleranceMinutes})))`);
    } else if (clockOutStatus === 'Late') {
      filterConditions.push(`(DATEPART(HOUR, a.ActualClockOut) > DATEPART(HOUR, s.ScheduledClockOut))`);
    } else if (clockOutStatus === 'OnTime') {
      filterConditions.push(`(DATEPART(HOUR, a.ActualClockOut) = DATEPART(HOUR, s.ScheduledClockOut) 
        AND DATEPART(MINUTE, a.ActualClockOut) >= DATEPART(MINUTE, s.ScheduledClockOut) - ${toleranceMinutes})`);
    }
  }
  
  // Combine all filter conditions with AND
  let whereClause = '';
  if (filterConditions.length > 0) {
    whereClause = `WHERE ${filterConditions.join(' AND ')}`;
  }
  
  console.log('Query builder - whereClause:', whereClause);
  console.log('Query builder - queryParams:', queryParams);
  
  return { whereClause, queryParams };
};

// Build base CTE queries for enhanced attendance with new schedule detection
const buildBaseCTEQueries = (toleranceMinutes = 15) => {
  return `
    WITH ScheduleData AS (
      SELECT 
        s.StaffNo AS StaffNo,
        s.Name AS Name,
        s.Department AS Department,
        s.time_in AS ScheduledClockIn,
        s.time_out AS ScheduledClockOut,
        CASE 
          -- Fixed/Normal Schedule: 07:00-17:00
          WHEN CONVERT(VARCHAR, s.time_in, 108) = '07:00:00' AND CONVERT(VARCHAR, s.time_out, 108) = '17:00:00' THEN 'Fixed'
          
          -- Two-Shift Schedule
          WHEN CONVERT(VARCHAR, s.time_in, 108) = '07:00:00' AND CONVERT(VARCHAR, s.time_out, 108) = '19:00:00' THEN 'TwoShift_Day'
          WHEN CONVERT(VARCHAR, s.time_in, 108) = '19:00:00' AND CONVERT(VARCHAR, s.time_out, 108) = '07:00:00' THEN 'TwoShift_Night'
          
          -- Three-Shift Schedule
          WHEN CONVERT(VARCHAR, s.time_in, 108) = '07:00:00' AND CONVERT(VARCHAR, s.time_out, 108) = '15:00:00' THEN 'ThreeShift_Morning'
          WHEN CONVERT(VARCHAR, s.time_in, 108) = '15:00:00' AND CONVERT(VARCHAR, s.time_out, 108) = '23:00:00' THEN 'ThreeShift_Afternoon'
          WHEN CONVERT(VARCHAR, s.time_in, 108) = '23:00:00' AND CONVERT(VARCHAR, s.time_out, 108) = '07:00:00' THEN 'ThreeShift_Night'
          
          ELSE 'Unknown'
        END AS ScheduleType
      FROM MTIUsers s
      WHERE s.StaffNo IS NOT NULL AND s.StaffNo <> ''
    ),
    AttendanceData AS (
      SELECT 
        a.StaffNo,
        a.TrDate,
        -- First try to get normal Clock In, if NULL then try Outside Range within 3 hours
        COALESCE(
          MIN(CASE WHEN a.ClockEvent = 'Clock In' THEN a.TrDateTime END),
          (SELECT TOP 1 ar.TrDateTime 
           FROM tblAttendanceReport ar 
           INNER JOIN ScheduleData sd ON ar.StaffNo = sd.StaffNo
           WHERE ar.StaffNo = a.StaffNo 
             AND ar.TrDate = a.TrDate 
             AND ar.ClockEvent = 'Outside Range'
             AND ABS(DATEDIFF(MINUTE, sd.ScheduledClockIn, ar.TrDateTime)) <= 180  -- Within 3 hours (180 minutes)
           ORDER BY ABS(DATEDIFF(MINUTE, sd.ScheduledClockIn, ar.TrDateTime)) ASC)
        ) AS ActualClockIn,
        -- First try to get normal Clock Out, if NULL then try Outside Range within 3 hours
        COALESCE(
          MAX(CASE WHEN a.ClockEvent = 'Clock Out' THEN a.TrDateTime END),
          (SELECT TOP 1 ar.TrDateTime 
           FROM tblAttendanceReport ar 
           INNER JOIN ScheduleData sd ON ar.StaffNo = sd.StaffNo
           WHERE ar.StaffNo = a.StaffNo 
             AND ar.TrDate = a.TrDate 
             AND ar.ClockEvent = 'Outside Range'
             AND ABS(DATEDIFF(MINUTE, sd.ScheduledClockOut, ar.TrDateTime)) <= 180  -- Within 3 hours (180 minutes)
           ORDER BY ABS(DATEDIFF(MINUTE, sd.ScheduledClockOut, ar.TrDateTime)) ASC)
        ) AS ActualClockOut,
        MIN(CASE WHEN a.ClockEvent = 'Clock In' THEN a.TrController END) AS ClockInController,
        MAX(CASE WHEN a.ClockEvent = 'Clock Out' THEN a.TrController END) AS ClockOutController,
        a.Position
      FROM tblAttendanceReport a
      WHERE a.TrDate BETWEEN @startDate AND @endDate
      GROUP BY a.StaffNo, a.TrDate, a.Position
    )`;
};

module.exports = {
  buildFilterConditions,
  buildBaseCTEQueries
};
