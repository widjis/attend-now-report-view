
import { toast } from "sonner";
import { EnhancedAttendanceFilters, EnhancedAttendanceResponse } from "@/types/enhancedAttendance";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch enhanced attendance data with filters
export const fetchEnhancedAttendanceData = async (filters: EnhancedAttendanceFilters): Promise<EnhancedAttendanceResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add required date filters
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    
    // Add optional filters
    if (filters.search) params.append('search', filters.search);
    if (filters.department && filters.department !== 'all') params.append('department', filters.department);
    if (filters.scheduleType && filters.scheduleType !== 'All') params.append('scheduleType', filters.scheduleType);
    if (filters.clockInStatus && filters.clockInStatus !== 'All') params.append('clockInStatus', filters.clockInStatus);
    if (filters.clockOutStatus && filters.clockOutStatus !== 'All') params.append('clockOutStatus', filters.clockOutStatus);
    
    // Add pagination
    params.append('page', filters.page.toString());
    params.append('pageSize', filters.pageSize.toString());
    
    const response = await fetch(`${API_BASE_URL}/enhanced-attendance?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching enhanced attendance data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch enhanced attendance data:', error);
    toast.error('Failed to load enhanced attendance data. Please try again.');
    return { data: [], total: 0, page: filters.page, pageSize: filters.pageSize, totalPages: 0 };
  }
};
