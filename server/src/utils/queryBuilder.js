
const buildFilterConditions = ({ StaffNo, Department, department, Position, startDate, endDate, search, scheduleType, clockInStatus, clockOutStatus, cardType }, toleranceMinutes = 15) => {
  const params = [];
  let whereClause = 'WHERE a.TrDate BETWEEN @startDate AND @endDate';

  if (StaffNo) {
    params.push({ name: 'StaffNo', value: StaffNo });
    whereClause += ' AND s.StaffNo = @StaffNo';
  }
  
  // Handle both uppercase and lowercase department parameter
  const deptFilter = Department || department;
  if (deptFilter && deptFilter !== '' && deptFilter !== 'all') {
    params.push({ name: 'Department', value: deptFilter });
    whereClause += ' AND s.Department = @Department';
  }
  
  // Position column not reliable across environments; skip filtering by Position for now

  // Free-text search: match StaffNo exactly OR Name contains
  if (search && search !== '') {
    params.push({ name: 'Search', value: search });
    whereClause += " AND (s.StaffNo = @Search OR s.Name LIKE '%' + @Search + '%')";
  }

  // Schedule Type filter - this will be applied after the CTE using HAVING or subquery
  if (scheduleType && scheduleType !== '' && scheduleType !== 'all') {
    params.push({ name: 'ScheduleType', value: scheduleType });
    // Note: ScheduleType filtering will be handled in the main query since it's computed
  }

  // Clock In Status filter
  if (clockInStatus && clockInStatus !== '' && clockInStatus !== 'all') {
    params.push({ name: 'ClockInStatus', value: clockInStatus });
    // Note: ClockInStatus filtering will be handled in the main query since it's computed
  }

  // Clock Out Status filter
  if (clockOutStatus && clockOutStatus !== '' && clockOutStatus !== 'all') {
    params.push({ name: 'ClockOutStatus', value: clockOutStatus });
    // Note: ClockOutStatus filtering will be handled in the main query since it's computed
  }

  // Card Type filter - need to join with CardDB or similar table
  if (cardType && cardType !== '' && cardType !== 'all') {
    params.push({ name: 'CardType', value: cardType });
    // Note: CardType filtering will need to be implemented based on available schema
  }

  return { whereClause, queryParams: params };
};

const buildBaseCTEQueries = (toleranceMinutes = 15) => `
  WITH ScheduleData AS (
    SELECT 
      u.StaffNo,
      u.Name,
      u.Department,
      u.description AS Description,
      u.time_in AS ScheduledClockIn,
      u.time_out AS ScheduledClockOut
    FROM MTIUsers u
  ), AttendanceData AS (
    SELECT 
      ar.StaffNo,
      ar.TrDate,
      MIN(CASE WHEN ar.ClockEvent = 'Clock In' THEN ar.TrDateTime END) AS ActualClockIn,
      MAX(CASE WHEN ar.ClockEvent = 'Clock Out' THEN ar.TrDateTime END) AS ActualClockOut,
      MIN(CASE WHEN ar.ClockEvent = 'Clock In' THEN ar.TrController END) AS ClockInController,
      MAX(CASE WHEN ar.ClockEvent = 'Clock Out' THEN ar.TrController END) AS ClockOutController,
      MIN(CASE WHEN ar.ScheduledClockIn IS NOT NULL THEN ar.ScheduledClockIn END) AS ScheduledClockInOverride,
      MAX(CASE WHEN ar.ScheduledClockOut IS NOT NULL THEN ar.ScheduledClockOut END) AS ScheduledClockOutOverride
    FROM tblAttendanceReport ar
    GROUP BY ar.StaffNo, ar.TrDate
  )
`;

module.exports = {
  buildFilterConditions,
  buildBaseCTEQueries
};
