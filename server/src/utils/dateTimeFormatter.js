
// Helper function to format time values to match frontend display (HH:MM)
const formatTime = (timeValue) => {
  try {
    if (!timeValue) return '';
    
    // If it's already a string in HH:MM format, return it directly
    if (typeof timeValue === 'string' && /^\d{1,2}:\d{2}$/.test(timeValue)) {
      return timeValue;
    }
    
    // If it's a string in HH:MM:SS format, extract HH:MM
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      try {
        const timeParts = timeValue.split(':');
        if (timeParts.length >= 2) {
          return `${timeParts[0]}:${timeParts[1]}`;
        }
        return timeValue;
      } catch (err) {
        console.warn('Error parsing time string:', timeValue, err.message);
        return '';
      }
    }
    
    // If it's a number (seconds), convert to HH:MM
    if (typeof timeValue === 'number') {
      if (isNaN(timeValue) || timeValue < 0) {
        console.warn('Invalid numeric time value:', timeValue);
        return '';
      }
      const hours = Math.floor(timeValue / 3600);
      const minutes = Math.floor((timeValue % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // If it's a Date object, extract just the time part (HH:MM) using UTC to avoid timezone conversion
    if (timeValue instanceof Date) {
      // Check if the date is valid before proceeding
      if (isNaN(timeValue.getTime())) {
        console.warn('Invalid date encountered:', timeValue);
        return '';
      }
      
      const hours = timeValue.getUTCHours();
      const minutes = timeValue.getUTCMinutes();
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      return formattedTime;
    }
    
    // If we get here, log the unexpected format
    console.warn('Unexpected time format:', typeof timeValue, timeValue);
    return timeValue.toString();
  } catch (err) {
    console.error('Error in formatTime:', err.message, 'Value:', timeValue);
    return '';
  }
};

// Helper function to format data for export to match frontend display
const formatDataForExport = (data) => {
  console.log('Raw data before formatting:', JSON.stringify(data.slice(0, 2), null, 2));
  
  const formattedData = data.map((row, index) => {
    try {
      // Helper function to safely create a date and format it
      const safeDate = (dateValue, fieldName) => {
        if (!dateValue) return '';
        
        // If it's already a time string in HH:MM format, return it directly
        if (typeof dateValue === 'string' && /^\d{1,2}:\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) {
            console.warn(`Invalid date in row ${index} for field ${fieldName}:`, dateValue);
            return '';
          }
          return date;
        } catch (err) {
          console.error(`Error processing date in row ${index} for field ${fieldName}:`, err.message);
          return '';
        }
      };
      
      return {
        ...row,
        Date: row.Date ? (() => {
          const date = safeDate(row.Date, 'Date');
          return date ? date.toISOString().split('T')[0] : '';
        })() : '',
        // Format scheduled times to HH:MM to match table display
        ScheduledClockIn: formatTime(safeDate(row.ScheduledClockIn, 'ScheduledClockIn')),
        ScheduledClockOut: formatTime(safeDate(row.ScheduledClockOut, 'ScheduledClockOut')),
        // Format actual times to HH:MM to match table display
        ActualClockIn: formatTime(safeDate(row.ActualClockIn, 'ActualClockIn')),
        ActualClockOut: formatTime(safeDate(row.ActualClockOut, 'ActualClockOut'))
      };
    } catch (err) {
      console.error(`Error formatting row ${index}:`, err.message, row);
      // Return a sanitized version of the row with empty strings for date fields
      return {
        ...row,
        Date: '',
        ScheduledClockIn: '',
        ScheduledClockOut: '',
        ActualClockIn: '',
        ActualClockOut: ''
      };
    }
  });
  
  console.log('Formatted data after processing:', JSON.stringify(formattedData.slice(0, 2), null, 2));
  return formattedData;
};

module.exports = {
  formatTime,
  formatDataForExport
};
