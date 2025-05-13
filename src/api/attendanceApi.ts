
import { AttendanceFilters, AttendanceResponse, AttendanceSummary } from "../types/attendance";
import { toast } from "sonner";

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Mock data generator function for fallback
const generateMockAttendanceData = (filters: AttendanceFilters): AttendanceResponse => {
  console.log("Using fallback mock data with filters:", filters);
  
  // Mock response data
  const mockResponse: AttendanceResponse = {
    data: Array.from({ length: filters.pageSize }, (_, i) => ({
      CardNo: `CARD${1000 + i}`,
      Name: `Employee ${i + 1}`,
      Title: `Title ${i % 5 + 1}`,
      Position: `Position ${i % 8 + 1}`,
      Department: `Department ${i % 5 + 1}`,
      CardType: `Type ${i % 3 + 1}`,
      Gender: i % 2 === 0 ? "Male" : "Female",
      MaritalStatus: i % 3 === 0 ? "Single" : "Married",
      Company: `Company ${i % 3 + 1}`,
      StaffNo: `EMP${1000 + i}`,
      TrDateTime: new Date(
        new Date(filters.startDate).getTime() +
          Math.random() * (new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime())
      ).toISOString(),
      TrDate: new Date(
        new Date(filters.startDate).getTime() +
          Math.random() * (new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime())
      ).toISOString(),
      dtTransaction: `TR${1000 + i}`,
      TrController: `Controller ${i % 4 + 1}`,
      ClockEvent: i % 2 === 0 ? "Clock In" : "Clock Out",
      InsertedDate: new Date().toISOString(),
      Processed: 1,
      UnitNo: `UNIT${i % 10 + 1}`,
    })),
    total: 1234,
    page: filters.page,
    pageSize: filters.pageSize,
  };

  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    mockResponse.data = mockResponse.data.filter((record) => 
      record.Name?.toLowerCase().includes(searchLower) || 
      record.Department?.toLowerCase().includes(searchLower) ||
      record.CardNo?.toLowerCase().includes(searchLower) ||
      record.StaffNo?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.department) {
    mockResponse.data = mockResponse.data.filter(
      (record) => record.Department === filters.department
    );
  }

  if (filters.company) {
    mockResponse.data = mockResponse.data.filter(
      (record) => record.Company === filters.company
    );
  }

  if (filters.cardType) {
    mockResponse.data = mockResponse.data.filter(
      (record) => record.CardType === filters.cardType
    );
  }

  return mockResponse;
};

// Mock summary data generator for fallback
const generateMockSummaryData = (startDate: string, endDate: string): AttendanceSummary => {
  console.log(`Using fallback mock summary data from ${startDate} to ${endDate}`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: string[] = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d).toISOString().split('T')[0]);
  }
  
  const mockSummary: AttendanceSummary = {
    totalRecords: Math.floor(Math.random() * 1000) + 500,
    totalClockIn: Math.floor(Math.random() * 500) + 250,
    totalClockOut: Math.floor(Math.random() * 500) + 250,
    validRecords: Math.floor(Math.random() * 800) + 400,
    invalidRecords: Math.floor(Math.random() * 200) + 50,
    validPercentage: 0,
    invalidPercentage: 0,
    
    byDate: days.map(day => ({
      date: day,
      clockIn: Math.floor(Math.random() * 50) + 20,
      clockOut: Math.floor(Math.random() * 50) + 20,
      total: Math.floor(Math.random() * 100) + 40
    })),
    
    byStatus: [
      { status: "On Time", count: Math.floor(Math.random() * 300) + 200 },
      { status: "Late", count: Math.floor(Math.random() * 100) + 50 },
      { status: "Early Departure", count: Math.floor(Math.random() * 100) + 30 },
      { status: "Overtime", count: Math.floor(Math.random() * 50) + 20 }
    ],
    
    byController: Array.from({ length: 6 }, (_, i) => ({
      controller: `Controller ${i + 1}`,
      valid: Math.floor(Math.random() * 200) + 100,
      invalid: Math.floor(Math.random() * 50) + 10,
      total: 0
    }))
  };
  
  mockSummary.validPercentage = Math.round((mockSummary.validRecords / mockSummary.totalRecords) * 100);
  mockSummary.invalidPercentage = Math.round((mockSummary.invalidRecords / mockSummary.totalRecords) * 100);
  
  mockSummary.byController = mockSummary.byController.map(item => ({
    ...item,
    total: item.valid + item.invalid
  }));
  
  return mockSummary;
};

// Check if backend is available
const checkBackendAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn("Backend health check failed:", error);
    return false;
  }
};

// Fetch attendance data with fallback to mock data
export const fetchAttendanceData = async (
  filters: AttendanceFilters
): Promise<AttendanceResponse> => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', filters.page.toString());
      queryParams.append('pageSize', filters.pageSize.toString());
      queryParams.append('startDate', filters.startDate);
      queryParams.append('endDate', filters.endDate);
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.cardType) queryParams.append('cardType', filters.cardType);
      
      const response = await fetch(`${API_BASE_URL}/attendance?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // Fallback to mock data
      console.log('Backend not available, using mock data');
      toast.warning('Using offline mode with mock data. Some features may be limited.');
      return generateMockAttendanceData(filters);
    }
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    toast.error("Failed to fetch attendance data. Falling back to offline mode.");
    return generateMockAttendanceData(filters);
  }
};

export const fetchAttendanceSummary = async (startDate: string, endDate: string): Promise<AttendanceSummary> => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      
      const response = await fetch(`${API_BASE_URL}/attendance/summary?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // Fallback to mock data
      console.log('Backend not available for summary, using mock data');
      toast.warning('Using offline mode with mock data. Some features may be limited.');
      return generateMockSummaryData(startDate, endDate);
    }
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    toast.error("Failed to fetch attendance summary. Falling back to offline mode.");
    return generateMockSummaryData(startDate, endDate);
  }
};

export const exportAttendanceData = async (filters: AttendanceFilters, format: "csv" | "pdf"): Promise<void> => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      queryParams.append('startDate', filters.startDate);
      queryParams.append('endDate', filters.endDate);
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.cardType) queryParams.append('cardType', filters.cardType);
      
      const toastPromise = toast.promise(
        fetch(`${API_BASE_URL}/export?${queryParams.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          // Handle the file download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `attendance-export-${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        }),
        {
          loading: `Preparing ${format.toUpperCase()} export...`,
          success: `Attendance data exported successfully as ${format.toUpperCase()}!`,
          error: "Export failed. Please try again.",
        }
      );
      
      await toastPromise;
    } else {
      // Fallback behavior for export when offline
      toast.error(`Export requires connection to the server. Currently offline.`);
    }
  } catch (error) {
    console.error(`Error exporting attendance data as ${format}:`, error);
    toast.error(`Failed to export data as ${format.toUpperCase()}. Please try again.`);
  }
};

export const getFilterOptions = async () => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      const response = await fetch(`${API_BASE_URL}/filters`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // Fallback to mock data
      console.log('Backend not available for filter options, using mock data');
      return {
        departments: ["HR", "IT", "Finance", "Operations", "Marketing"],
        companies: ["Company 1", "Company 2", "Company 3"],
        cardTypes: ["Employee", "Contractor", "Visitor"],
      };
    }
  } catch (error) {
    console.error("Error fetching filter options:", error);
    // Return mock data as fallback
    return {
      departments: ["HR", "IT", "Finance", "Operations", "Marketing"],
      companies: ["Company 1", "Company 2", "Company 3"],
      cardTypes: ["Employee", "Contractor", "Visitor"],
    };
  }
};
