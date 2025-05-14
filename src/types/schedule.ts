
export interface TimeSchedule {
  StaffNo: string;
  Name: string;
  TimeIn: string | null;
  TimeOut: string | null;
  Email?: string | null;
  Department?: string | null;
}

export interface TimeScheduleResponse {
  data: TimeSchedule[];
  total: number;
}

export interface ScheduleFilters {
  search?: string;
  department?: string;
  page: number;
  pageSize: number;
}
