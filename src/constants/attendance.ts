import { SelectOption, ScheduleTypeOption, StatusOption } from "@/types/ui";

// Schedule type options
export const SCHEDULE_TYPE_OPTIONS: SelectOption<ScheduleTypeOption>[] = [
  { value: "", label: "All Schedule Types" },
  { value: "Fixed", label: "Fixed 7-17" },
  { value: "TwoShift_Day", label: "2-Shift Day" },
  { value: "TwoShift_Night", label: "2-Shift Night" },
  { value: "ThreeShift_Morning", label: "3-Shift Morning" },
  { value: "ThreeShift_Afternoon", label: "3-Shift Afternoon" },
  { value: "ThreeShift_Night", label: "3-Shift Night" },
];

// Status options
export const STATUS_OPTIONS: SelectOption<StatusOption>[] = [
  { value: "", label: "All Statuses" },
  { value: "Early", label: "Early" },
  { value: "OnTime", label: "On Time" },
  { value: "Late", label: "Late" },
  { value: "Out of Range", label: "🚨 Out of Range" },
  { value: "Missing", label: "Missing" },
];

// Page size options
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Default values
export const DEFAULT_PAGE_SIZE = 25;
export const DEFAULT_DATE_RANGE_DAYS = 7;

// Export file naming
export const EXPORT_FILENAME_PREFIX = "enhanced-attendance";

// API configuration
export const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes