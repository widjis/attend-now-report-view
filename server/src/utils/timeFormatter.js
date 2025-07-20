/**
 * Utility functions for handling SQL Server time data types
 * SQL Server time fields are returned as Date objects with 1970-01-01 dates
 * We need to extract just the time portion for display
 */

/**
 * Format SQL Server time field to HH:MM format
 * @param {Date|string|null} timeValue - The time value from SQL Server
 * @returns {string|null} - Formatted time string (HH:MM) or null
 */
function formatSQLTime(timeValue) {
  // Handle null, undefined, and empty strings
  if (!timeValue || timeValue === '') return null;
  
  try {
    // If it's already a string in HH:MM format, return as is
    if (typeof timeValue === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeValue)) {
      return timeValue.substring(0, 5); // Return just HH:MM
    }
    
    // If it's a Date object (from SQL Server time type)
    if (timeValue instanceof Date) {
      const hours = timeValue.getHours().toString().padStart(2, '0');
      const minutes = timeValue.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // If it's a string that can be parsed as a date
    if (typeof timeValue === 'string') {
      const date = new Date(timeValue);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error formatting time value:', timeValue, error);
    return null;
  }
}

/**
 * Extract time range from day_type string
 * @param {string} dayType - Day type string like "07:00-17:00" or "07:00-17:00 7"
 * @returns {Object|null} - Object with start and end times or null if not parseable
 */
function extractTimeFromDayType(dayType) {
  if (!dayType || typeof dayType !== 'string') return null;
  
  try {
    // Match patterns like "07:00-17:00", "07:00-17:00 7", "07:00-17:00 67", etc.
    const timeRangeMatch = dayType.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})/);
    
    if (timeRangeMatch) {
      return {
        start: timeRangeMatch[1],
        end: timeRangeMatch[2]
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Error extracting time from day_type:', dayType, error);
    return null;
  }
}

/**
 * Format employee data with properly formatted time fields
 * Apply day_type time when time_in/time_out are missing
 * @param {Object} employee - Raw employee data from database
 * @returns {Object} - Employee data with formatted time fields
 */
function formatEmployeeData(employee) {
  let timeIn = formatSQLTime(employee.time_in);
  let timeOut = formatSQLTime(employee.time_out);
  
  // If time_in or time_out are missing, try to extract from day_type
  if ((!timeIn || !timeOut) && employee.day_type) {
    const dayTypeTime = extractTimeFromDayType(employee.day_type);
    
    if (dayTypeTime) {
      // Apply day_type time only if the corresponding field is missing
      if (!timeIn) {
        timeIn = dayTypeTime.start;
      }
      if (!timeOut) {
        timeOut = dayTypeTime.end;
      }
    }
  }
  
  return {
    ...employee,
    time_in: timeIn,
    time_out: timeOut,
    // Also format legacy fields if they exist
    TimeIn: employee.TimeIn ? formatSQLTime(employee.TimeIn) : undefined,
    TimeOut: employee.TimeOut ? formatSQLTime(employee.TimeOut) : undefined
  };
}

/**
 * Format an array of employee data
 * @param {Array} employees - Array of employee objects
 * @returns {Array} - Array of formatted employee objects
 */
function formatEmployeesData(employees) {
  return employees.map(formatEmployeeData);
}

/**
 * Parse time string to minutes for comparison/sorting
 * @param {string} timeString - Time in HH:MM format
 * @returns {number} - Minutes since midnight
 */
function timeToMinutes(timeString) {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate work duration between time_in and time_out
 * @param {string} timeIn - Start time in HH:MM format
 * @param {string} timeOut - End time in HH:MM format
 * @returns {Object} - Duration info with hours, minutes, and formatted string
 */
function calculateWorkDuration(timeIn, timeOut) {
  if (!timeIn || !timeOut) return null;
  
  try {
    let startMinutes = timeToMinutes(timeIn);
    let endMinutes = timeToMinutes(timeOut);
    
    // Handle overnight shifts (when end time is less than start time)
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return {
      totalMinutes: durationMinutes,
      hours,
      minutes,
      formatted: `${hours}h ${minutes}m`
    };
  } catch (error) {
    console.warn('Error calculating work duration:', timeIn, timeOut, error);
    return null;
  }
}

module.exports = {
  formatSQLTime,
  extractTimeFromDayType,
  formatEmployeeData,
  formatEmployeesData,
  timeToMinutes,
  calculateWorkDuration
};