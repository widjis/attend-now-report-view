
import React from "react";
import { Box } from "@mui/material";
import { DateRangePicker as MuiDateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateRange } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";

interface DateRangePickerProps {
  // Original props
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  
  // New props
  dateRange?: DateRange<Date>;
  onDateRangeChange?: (range: DateRange<Date>) => void;
  
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  dateRange,
  onDateRangeChange,
  className,
}) => {
  // Convert individual dates to DateRange object for the calendar
  const selectedRange: DateRange<Dayjs> = dateRange ? [dateRange[0] ? dayjs(dateRange[0]) : null, dateRange[1] ? dayjs(dateRange[1]) : null] : [startDate ? dayjs(startDate) : null, endDate ? dayjs(endDate) : null];
  
  // Handle date range change from the calendar component
  const handleDateRangeChange = (range: DateRange<Dayjs>) => {
    const convertedRange: DateRange<Date> = [range[0] ? range[0].toDate() : null, range[1] ? range[1].toDate() : null];
    
    if (onDateRangeChange) {
      // Use the new prop if provided
      onDateRangeChange(convertedRange);
    } else {
      // Fall back to the old props
      if (convertedRange[0] && onStartDateChange) {
        onStartDateChange(convertedRange[0]);
      }
      if (convertedRange[1] && onEndDateChange) {
        onEndDateChange(convertedRange[1]);
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className={className}>
        <MuiDateRangePicker
          value={selectedRange}
          onChange={handleDateRangeChange}
          localeText={{ start: 'Start Date', end: 'End Date' }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;
