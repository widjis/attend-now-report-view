
// Helper function to format time values to match frontend display
const formatTime = (timeValue) => {
  if (!timeValue) return '';
  
  // If it's already a string in HH:MM:SS format, return as is
  if (typeof timeValue === 'string' && timeValue.includes(':')) {
    return timeValue;
  }
  
  // If it's a number (seconds), convert to HH:MM:SS
  if (typeof timeValue === 'number') {
    const hours = Math.floor(timeValue / 3600);
    const minutes = Math.floor((timeValue % 3600) / 60);
    const seconds = timeValue % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // If it's a Date object, extract just the time part (HH:MM:SS)
  if (timeValue instanceof Date) {
    return timeValue.toTimeString().split(' ')[0];
  }
  
  return timeValue.toString();
};

// Helper function to format data for export to match frontend display
const formatDataForExport = (data) => {
  return data.map(row => ({
    ...row,
    Date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
    ScheduledClockIn: row.ScheduledClockIn ? formatTime(row.ScheduledClockIn) : '',
    ScheduledClockOut: row.ScheduledClockOut ? formatTime(row.ScheduledClockOut) : '',
    // Format actual times to show only HH:MM:SS like the frontend
    ActualClockIn: row.ActualClockIn ? formatTime(new Date(row.ActualClockIn)) : '',
    ActualClockOut: row.ActualClockOut ? formatTime(new Date(row.ActualClockOut)) : ''
  }));
};

module.exports = {
  formatTime,
  formatDataForExport
};
