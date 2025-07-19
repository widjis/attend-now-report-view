// UI-specific types for better type safety and reusability
import { Dayjs } from "dayjs";

export type ScheduleTypeOption = "" | "Fixed" | "TwoShift_Day" | "TwoShift_Night" | "ThreeShift_Morning" | "ThreeShift_Afternoon" | "ThreeShift_Night";

export type StatusOption = "" | "Early" | "OnTime" | "Late" | "Missing";

export type ExportFormat = "csv" | "pdf" | "xlsx";

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

export interface FilterState {
  startDate: Dayjs;
  endDate: Dayjs;
  searchTerm: string;
  department: string;
  scheduleType: ScheduleTypeOption;
  clockInStatus: StatusOption;
  clockOutStatus: StatusOption;
  currentPage: number;
  pageSize: number;
}

export interface ExportState {
  isExporting: boolean;
  format?: ExportFormat;
}