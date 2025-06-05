
// Helper function to format time values to match frontend display (HH:MM)
const formatTime = (timeValue) => {
  if (!timeValue) return '';
  
  // If it's already a string in HH:MM:SS format, extract HH:MM
  if (typeof timeValue === 'string' && timeValue.includes(':')) {
    const timeParts = timeValue.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    return timeValue;
  }
  
  // If it's a number (seconds), convert to HH:MM
  if (typeof timeValue === 'number') {
    const hours = Math.floor(timeValue / 3600);
    const minutes = Math.floor((timeValue % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // If it's a Date object, extract just the time part (HH:MM)
  if (timeValue instanceof Date) {
    const timeString = timeValue.toTimeString().split(' ')[0]; // Gets HH:MM:SS
    const timeParts = timeString.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  }
  
  return timeValue.toString();
};

// Helper function to format data for export to match frontend display
const formatDataForExport = (data) => {
  console.log('Raw data before formatting:', JSON.stringify(data.slice(0, 2), null, 2));
  
  const formattedData = data.map(row => ({
    ...row,
    Date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
    // Format scheduled times to HH:MM to match table display
    ScheduledClockIn: row.ScheduledClockIn ? formatTime(row.ScheduledClockIn) : '',
    ScheduledClockOut: row.ScheduledClockOut ? formatTime(row.ScheduledClockOut) : '',
    // Format actual times to HH:MM to match table display
    ActualClockIn: row.ActualClockIn ? formatTime(new Date(row.ActualClockIn)) : '',
    ActualClockOut: row.ActualClockOut ? formatTime(new Date(row.ActualClockOut)) : ''
  }));
  
  console.log('Formatted data after processing:', JSON.stringify(formattedData.slice(0, 2), null, 2));
  return formattedData;
};

module.exports = {
  formatTime,
  formatDataForExport
};
