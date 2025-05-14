
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
  timeInStats?: {
    available: number;
    unavailable: number;
  };
  timeOutStats?: {
    available: number;
    unavailable: number;
  };
}

export interface ScheduleFilters {
  search?: string;
  department?: string;
  timeInStatus?: 'available' | 'unavailable' | 'all';
  timeOutStatus?: 'available' | 'unavailable' | 'all';
  page: number;
  pageSize: number;
}
