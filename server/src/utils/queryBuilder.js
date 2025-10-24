
const buildFilterConditions = ({ StaffNo, Department, Position, startDate, endDate, search }, toleranceMinutes = 15) => {
  const params = [];
  let whereClause = 'WHERE a.TrDate BETWEEN @startDate AND @endDate';

  if (StaffNo) {
    params.push({ name: 'StaffNo', value: StaffNo });
    whereClause += ' AND s.StaffNo = @StaffNo';
  }
  if (Department) {
    params.push({ name: 'Department', value: Department });
    whereClause += ' AND s.Department = @Department';
  }
  // Position column not reliable across environments; skip filtering by Position for now

  // Free-text search: match StaffNo exactly OR Name contains
  if (search) {
    params.push({ name: 'Search', value: search });
    whereClause += " AND (s.StaffNo = @Search OR s.Name LIKE '%' + @Search + '%')";
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
