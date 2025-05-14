
import { toast } from "sonner";
import { EnhancedAttendanceFilters, EnhancedAttendanceResponse } from "@/types/enhancedAttendance";

// Get API base URL based on environment configuration
const getApiBaseUrl = () => {
  const useRelativeUrl = import.meta.env.VITE_USE_RELATIVE_API_URL === 'true';
  return useRelativeUrl ? '/api' : import.meta.env.VITE_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

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
      let errorMessage = `Error ${response.status}: Failed to fetch attendance data`;
      
      try {
        const errorData = await response.json();
        console.error(`Server error (${response.status}):`, errorData);
        
        if (errorData.message) {
          errorMessage = `Server error: ${errorData.message}`;
        }
      } catch (parseError) {
        const errorText = await response.text();
        console.error(`Server error (${response.status}):`, errorText);
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch enhanced attendance data:', error);
    toast.error('Failed to load attendance data. Please try again.');
    // Return empty data to prevent UI crashes
    return { 
      data: [], 
      total: 0, 
      page: filters.page, 
      pageSize: filters.pageSize, 
      totalPages: 0 
    };
  }
};
