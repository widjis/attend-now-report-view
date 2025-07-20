
// Legacy interface for backward compatibility
export interface TimeSchedule {
  StaffNo: string;
  Name: string;
  TimeIn: string | null;
  TimeOut: string | null;
  Email?: string | null;
  Department?: string | null;
}

// New interface for MTIUsers table
export interface MTIUser {
  employee_id: string;
  employee_name: string;
  gender?: string;
  division?: string;
  department?: string;
  section?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  position_title?: string;
  grade_interval?: string;
  phone?: string;
  day_type?: string;
  description?: string;
  time_in?: string | null;
  time_out?: string | null;
  next_day?: boolean;
  CardNo?: string;
  AccessLevel?: number;
  Name?: string;
  FirstName?: string;
  LastName?: string;
  StaffNo?: string;
}

// Enhanced response interface for MTIUsers
export interface MTIUserResponse {
  data: MTIUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  timeInStats: {
    available: number;
    unavailable: number;
  };
  timeOutStats: {
    available: number;
    unavailable: number;
  };
  organizationStats: {
    totalDepartments: number;
    totalDivisions: number;
    totalSections: number;
    totalDayTypes: number;
  };
}

// Legacy response interface for backward compatibility
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

// Enhanced filters for MTIUsers
export interface MTIUserFilters {
  search?: string;
  department?: string;
  division?: string;
  section?: string;
  dayType?: string;
  timeInStatus?: 'available' | 'unavailable' | 'all';
  timeOutStatus?: 'available' | 'unavailable' | 'all';
  page: number;
  pageSize: number;
}

// Legacy filters for backward compatibility
export interface ScheduleFilters {
  search?: string;
  department?: string;
  timeInStatus?: 'available' | 'unavailable' | 'all';
  timeOutStatus?: 'available' | 'unavailable' | 'all';
  page: number;
  pageSize: number;
}

// Filter options interface
export interface FilterOptions {
  departments: string[];
  divisions: string[];
  sections: string[];
  dayTypes: string[];
}

// Organization hierarchy interface
export interface OrganizationSection {
  name: string;
  employeeCount: number;
  employeesWithSchedule: number;
}

export interface OrganizationDepartment {
  name: string;
  sections: Record<string, OrganizationSection>;
  totalEmployees: number;
  totalWithSchedule: number;
}

export interface OrganizationDivision {
  name: string;
  departments: Record<string, OrganizationDepartment>;
  totalEmployees: number;
  totalWithSchedule: number;
}

export interface OrganizationHierarchy {
  [division: string]: OrganizationDivision;
}
