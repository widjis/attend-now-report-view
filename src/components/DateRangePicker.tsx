
import React from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  // Original props
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  
  // New props
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  
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
  const selectedRange: DateRange = dateRange || {
    from: startDate,
    to: endDate
  };
  
  // Handle date range change from the calendar component
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (onDateRangeChange) {
      // Use the new prop if provided
      onDateRangeChange(range);
    } else {
      // Fall back to the old props
      if (range?.from && onStartDateChange) {
        onStartDateChange(range.from);
      }
      if (range?.to && onEndDateChange) {
        onEndDateChange(range.to);
      }
    }
  };

  // Get the dates to display
  const fromDate = selectedRange.from || new Date();
  const toDate = selectedRange.to || fromDate;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {format(fromDate, "LLL dd, y")} - {format(toDate, "LLL dd, y")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={fromDate}
            selected={selectedRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
