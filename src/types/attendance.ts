
export interface AttendanceRecord {
  CardNo: string | null;
  Name: string | null;
  Title: string | null;
  Position: string | null;
  Department: string | null;
  CardType: string | null;
  Gender: string | null;
  MaritalStatus: string | null;
  Company: string | null;
  StaffNo: string | null;
  TrDateTime: string | null;
  TrDate: string | null;
  dtTransaction: string | null;
  TrController: string | null;
  ClockEvent: string | null;
  InsertedDate: string | null;
  Processed: number | null;
  UnitNo: string | null;
}

export interface AttendanceResponse {
  data: AttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AttendanceFilters {
  startDate: string;
  endDate: string;
  search: string;
  department?: string;
  company?: string;
  cardType?: string;
  page: number;
  pageSize: number;
}

// Dashboard Types
export type AttendanceTimeframe = "day" | "week" | "month" | "quarter";

export interface DateAttendance {
  date: string;
  clockIn: number;
  clockOut: number;
  total: number;
}

export interface StatusAttendance {
  status: string;
  count: number;
}

export interface ControllerAttendance {
  controller: string;
  valid: number;
  invalid: number;
  total: number;
}

export interface AttendanceSummary {
  totalRecords: number;
  totalClockIn: number;
  totalClockOut?: number;
  validRecords: number;
  invalidRecords: number;
  validPercentage: number;
  invalidPercentage: number;
  byDate?: DateAttendance[];
  byStatus?: StatusAttendance[];
  byController?: ControllerAttendance[];
}
