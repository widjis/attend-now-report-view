
import { AttendanceRecord } from "./attendance";
import { TimeSchedule } from "./schedule";

export interface EnhancedAttendanceRecord {
  // Employee information
  StaffNo: string;
  Name: string;
  Department?: string | null;
  Position?: string | null;
  
  // Schedule information
  Date: string;
  ScheduledClockIn: string | null;
  ScheduledClockOut: string | null;
  ScheduleType: 'Fixed' | 'Shift1' | 'Shift2' | 'Shift3' | 'Unknown';
  
  // Actual attendance
  ActualClockIn: string | null;
  ActualClockOut: string | null;
  ClockInController?: string | null;
  ClockOutController?: string | null;
  
  // Status indicators
  ClockInStatus?: 'Early' | 'OnTime' | 'Late' | 'Missing' | null;
  ClockOutStatus?: 'Early' | 'OnTime' | 'Late' | 'Missing' | null;
}

export interface EnhancedAttendanceResponse {
  data: EnhancedAttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EnhancedAttendanceFilters {
  startDate: string;
  endDate: string;
  search?: string;
  department?: string;
  scheduleType?: 'Fixed' | 'Shift1' | 'Shift2' | 'Shift3' | 'All';
  clockInStatus?: 'Early' | 'OnTime' | 'Late' | 'Missing' | 'All';
  clockOutStatus?: 'Early' | 'OnTime' | 'Late' | 'Missing' | 'All';
  page: number;
  pageSize: number;
}
