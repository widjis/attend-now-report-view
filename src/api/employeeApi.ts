
import { EmployeeFilters, EmployeeScheduleResponse } from "../types/employee";
import { toast } from "sonner";

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Mock data generator function for fallback
const generateMockEmployeeData = (filters: EmployeeFilters): EmployeeScheduleResponse => {
  console.log("Using fallback mock employee data with filters:", filters);
  
  // Mock response data
  const mockResponse: EmployeeScheduleResponse = {
    data: Array.from({ length: filters.pageSize }, (_, i) => ({
      staffNo: `EMP${1000 + i}`,
      name: `Employee ${i + 1}`,
      position: `Position ${i % 8 + 1}`,
      department: `Department ${i % 5 + 1}`,
      company: `Company ${i % 3 + 1}`,
      timeIn: `0${7 + (i % 3)}:${i % 2 === 0 ? '00' : '30'}:00`,
      timeOut: `${17 + (i % 2)}:${i % 2 === 0 ? '00' : '30'}:00`,
    })),
    total: 87,
    page: filters.page,
    pageSize: filters.pageSize,
  };

  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    mockResponse.data = mockResponse.data.filter((record) => 
      record.name.toLowerCase().includes(searchLower) || 
      record.department.toLowerCase().includes(searchLower) ||
      record.staffNo.toLowerCase().includes(searchLower)
    );
  }

  if (filters.department) {
    mockResponse.data = mockResponse.data.filter(
      (record) => record.department === filters.department
    );
  }

  if (filters.company) {
    mockResponse.data = mockResponse.data.filter(
      (record) => record.company === filters.company
    );
  }

  return mockResponse;
};

// Check if backend is available
const checkBackendAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
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

// Fetch employee schedule data with fallback to mock data
export const fetchEmployeeSchedule = async (
  filters: EmployeeFilters
): Promise<EmployeeScheduleResponse> => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', filters.page.toString());
      queryParams.append('pageSize', filters.pageSize.toString());
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.company) queryParams.append('company', filters.company);
      
      const response = await fetch(`${API_BASE_URL}/employees/schedule?${queryParams.toString()}`, {
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
      return generateMockEmployeeData(filters);
    }
  } catch (error) {
    console.error("Error fetching employee schedule data:", error);
    toast.error("Failed to fetch employee schedule data. Falling back to offline mode.");
    return generateMockEmployeeData(filters);
  }
};
