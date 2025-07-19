import { EnhancedAttendanceRecord } from "@/types/enhancedAttendance";

// Mock data generators for testing
export const createMockAttendanceRecord = (overrides: Partial<EnhancedAttendanceRecord> = {}): EnhancedAttendanceRecord => ({
  StaffNo: "EMP001",
  Name: "John Doe",
  Department: "Engineering",
  Position: "Software Developer",
  Date: "2024-01-15",
  ScheduledClockIn: "09:00:00",
  ScheduledClockOut: "17:00:00",
  ScheduleType: "Fixed",
  ActualClockIn: "09:05:00",
  ActualClockOut: "17:00:00",
  ClockInController: "Terminal A",
  ClockOutController: "Terminal A",
  ClockInStatus: "Late",
  ClockOutStatus: "OnTime",
  ...overrides,
});

export const createMockAttendanceData = (count: number = 10): EnhancedAttendanceRecord[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockAttendanceRecord({
      StaffNo: `EMP${String(index + 1).padStart(3, '0')}`,
      Name: `Employee ${index + 1}`,
    })
  );
};

// Test data scenarios
export const testScenarios = {
  lateClockIn: createMockAttendanceRecord({
    ActualClockIn: "09:20:00",
    ClockInStatus: "Late",
  }),
  
  earlyClockOut: createMockAttendanceRecord({
    ActualClockOut: "16:30:00",
    ClockOutStatus: "Early",
  }),
  
  missingClockIn: createMockAttendanceRecord({
    ActualClockIn: null,
    ClockInStatus: "Missing",
  }),
  
  perfectAttendance: createMockAttendanceRecord({
    ActualClockIn: "09:00:00",
    ActualClockOut: "17:00:00",
    ClockInStatus: "OnTime",
    ClockOutStatus: "OnTime",
  }),
};