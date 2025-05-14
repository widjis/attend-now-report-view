
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
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}) => {
  // Convert individual dates to DateRange object for the calendar
  const dateRange: DateRange = {
    from: startDate,
    to: endDate
  };
  
  // Handle date range change from the calendar component
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      onStartDateChange(range.from);
    }
    if (range?.to) {
      onEndDateChange(range.to);
    }
  };

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
            {format(startDate, "LLL dd, y")} - {format(endDate, "LLL dd, y")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={startDate}
            selected={dateRange}
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
