
export interface Employee {
  staffNo: string;
  name: string;
  position: string;
  department: string;
  company: string;
  timeIn: string;
  timeOut: string;
}

export interface EmployeeScheduleResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EmployeeFilters {
  page: number;
  pageSize: number;
  search?: string;
  department?: string;
  company?: string;
}
