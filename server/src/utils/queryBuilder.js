
// Build filter conditions for enhanced attendance queries
const buildFilterConditions = (filters, toleranceMinutes = 15) => {
  const { search, department, scheduleType, clockInStatus, clockOutStatus } = filters;
  let filterConditions = [];
  const queryParams = [
    { name: 'startDate', value: filters.startDate },
    { name: 'endDate', value: filters.endDate }
  ];
  
  // Add search filter if provided
  if (search) {
    filterConditions.push(`(s.StaffNo LIKE @search OR s.Name LIKE @search)`);
    queryParams.push({ name: 'search', value: `%${search}%` });
  }
  
  // Add department filter if provided
  if (department && department !== 'all') {
    filterConditions.push(`s.Department = @department`);
    queryParams.push({ name: 'department', value: department });
  }
  
  // Add schedule type filter if provided
  if (scheduleType && scheduleType !== 'All') {
    filterConditions.push(`s.ScheduleType = @scheduleType`);
    queryParams.push({ name: 'scheduleType', value: scheduleType });
  }
  
  // Add clock in status filter if provided
  if (clockInStatus && clockInStatus !== 'All') {
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
  if (clockOutStatus && clockOutStatus !== 'All') {
    if (clockOutStatus === 'Missing') {
      filterConditions.push(`a.ActualClockOut IS NULL`);
    } else if (clockOutStatus === 'Early') {
      filterConditions.push(`(DATEPART(HOUR, a.ActualClockOut) < DATEPART(HOUR, s.ScheduledClockOut) 
        OR (DATEPART(HOUR, a.ActualClockOut) = DATEPART(HOUR, s.ScheduledClockOut) 
        AND DATEPART(MINUTE, a.ActualClockOut) < DATEPART(MINUTE, s.ScheduledClockOut) - ${toleranceMinutes}))`);
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
  
  return { whereClause, queryParams };
};

// Build base CTE queries for enhanced attendance with new schedule detection
const buildBaseCTEQueries = (toleranceMinutes = 15) => {
  return `
    WITH ScheduleData AS (
      SELECT 
        s.StaffNo,
        s.Name,
        s.Department,
        s.TimeIn AS ScheduledClockIn,
        s.TimeOut AS ScheduledClockOut,
        CASE 
          -- Fixed/Normal Schedule: 07:00-17:00
          WHEN s.TimeIn = '07:00:00' AND s.TimeOut = '17:00:00' THEN 'Fixed'
          
          -- Two-Shift Schedule
          WHEN s.TimeIn = '07:00:00' AND s.TimeOut = '19:00:00' THEN 'TwoShift_Day'
          WHEN s.TimeIn = '19:00:00' AND s.TimeOut = '07:00:00' THEN 'TwoShift_Night'
          
          -- Three-Shift Schedule
          WHEN s.TimeIn = '06:00:00' AND s.TimeOut = '14:00:00' THEN 'ThreeShift_Morning'
          WHEN s.TimeIn = '14:00:00' AND s.TimeOut = '22:00:00' THEN 'ThreeShift_Afternoon'
          WHEN s.TimeIn = '22:00:00' AND s.TimeOut = '06:00:00' THEN 'ThreeShift_Night'
          
          ELSE 'Unknown'
        END AS ScheduleType
      FROM CardDBTimeSchedule s
      WHERE s.StaffNo IS NOT NULL AND s.StaffNo <> '' AND s.StaffNo LIKE '%MTI%'
    ),
    AttendanceData AS (
      SELECT 
        a.StaffNo,
        a.TrDate,
        MIN(CASE WHEN a.ClockEvent = 'Clock In' THEN a.TrDateTime END) AS ActualClockIn,
        MAX(CASE WHEN a.ClockEvent = 'Clock Out' THEN a.TrDateTime END) AS ActualClockOut,
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
