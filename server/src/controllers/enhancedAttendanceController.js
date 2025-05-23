
const { poolPromise, sql } = require('../config/db');

// Get enhanced attendance data (combining schedule and actual attendance)
exports.getEnhancedAttendanceData = async (req, res, next) => {
  try {
    // Get query parameters for filtering and pagination
    const {
      startDate,
      endDate,
      search = '',
      department,
      scheduleType,
      clockInStatus,
      clockOutStatus,
      page = 1,
      pageSize = 10
    } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const pool = await poolPromise;
    
    // Calculate pagination parameters
    const offset = (page - 1) * pageSize;
    
    // Define tolerance in minutes for early/late status (15 minutes)
    const toleranceMinutes = 15;
    
    // Build the query with proper parameter references
    const baseQuery = `
      WITH ScheduleData AS (
        SELECT 
          s.StaffNo,
          s.Name,
          s.Department,
          s.TimeIn AS ScheduledClockIn,
          s.TimeOut AS ScheduledClockOut,
          CASE 
            WHEN s.TimeIn = '07:00:00' AND s.TimeOut = '17:00:00' THEN 'Fixed'
            WHEN s.TimeIn = '07:00:00' AND s.TimeOut = '15:00:00' THEN 'Shift1'
            WHEN s.TimeIn = '15:00:00' AND s.TimeOut = '23:00:00' THEN 'Shift2'
            WHEN s.TimeIn = '23:00:00' AND s.TimeOut = '07:00:00' THEN 'Shift3'
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
      )
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
    `;
    
    // Build the filter conditions separately from the base query
    let filterConditions = [];
    const queryParams = [
      { name: 'startDate', value: startDate },
      { name: 'endDate', value: endDate }
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
    
    // Count query with filters
    const countQuery = `
      WITH ScheduleData AS (
        SELECT 
          s.StaffNo,
          s.Name,
          s.Department,
          s.TimeIn AS ScheduledClockIn,
          s.TimeOut AS ScheduledClockOut,
          CASE 
            WHEN s.TimeIn = '07:00:00' AND s.TimeOut = '17:00:00' THEN 'Fixed'
            WHEN s.TimeIn = '07:00:00' AND s.TimeOut = '15:00:00' THEN 'Shift1'
            WHEN s.TimeIn = '15:00:00' AND s.TimeOut = '23:00:00' THEN 'Shift2'
            WHEN s.TimeIn = '23:00:00' AND s.TimeOut = '07:00:00' THEN 'Shift3'
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
      ),
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
      WITH ScheduleData AS (
        SELECT 
          s.StaffNo,
          s.Name,
          s.Department,
          s.TimeIn AS ScheduledClockIn,
          s.TimeOut AS ScheduledClockOut,
          CASE 
            WHEN s.TimeIn = '07:00:00' AND s.TimeOut = '17:00:00' THEN 'Fixed'
            WHEN s.TimeIn = '07:00:00' AND s.TimeOut = '15:00:00' THEN 'Shift1'
            WHEN s.TimeIn = '15:00:00' AND s.TimeOut = '23:00:00' THEN 'Shift2'
            WHEN s.TimeIn = '23:00:00' AND s.TimeOut = '07:00:00' THEN 'Shift3'
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
      ),
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
    
    // Add parameters to the request
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
    
    // Return formatted response
    res.json({
      data: dataResult.recordset,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    console.error('Error fetching enhanced attendance data:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: err.message
    });
  }
};
