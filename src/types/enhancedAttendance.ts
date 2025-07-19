
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
  ScheduleType: 'Fixed' | 'TwoShift_Day' | 'TwoShift_Night' | 'ThreeShift_Morning' | 'ThreeShift_Afternoon' | 'ThreeShift_Night' | 'Unknown';
  
  // Actual attendance
  ActualClockIn: string | null;
  ActualClockOut: string | null;
  ClockInController?: string | null;
  ClockOutController?: string | null;
  
  // Status indicators
  ClockInStatus?: 'Early' | 'OnTime' | 'Late' | 'Out of Range' | 'Missing' | null;
  ClockOutStatus?: 'Early' | 'OnTime' | 'Late' | 'Out of Range' | 'Missing' | null;
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
  scheduleType?: 'Fixed' | 'TwoShift_Day' | 'TwoShift_Night' | 'ThreeShift_Morning' | 'ThreeShift_Afternoon' | 'ThreeShift_Night' | 'All';
  clockInStatus?: 'Early' | 'OnTime' | 'Late' | 'Out of Range' | 'Missing' | 'All';
  clockOutStatus?: 'Early' | 'OnTime' | 'Late' | 'Out of Range' | 'Missing' | 'All';
  page: number;
  pageSize: number;
}
