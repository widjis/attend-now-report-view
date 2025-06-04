
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
    console.log("Using API base URL:", API_BASE_URL);
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
    
    const url = `${API_BASE_URL}/enhanced-attendance?${params.toString()}`;
    console.log("Fetching from URL:", url);
    
    const response = await fetch(url);
    
    // Log response details for debugging
    console.log("Response status:", response.status);
    console.log("Response headers:", [...response.headers.entries()]);
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: Failed to fetch attendance data`;
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          console.error(`Server error (${response.status}):`, errorData);
          
          if (errorData.message) {
            errorMessage = `Server error: ${errorData.message}`;
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error(`Server error (${response.status}), raw response:`, errorText);
        }
      } else {
        // Handle non-JSON responses
        const errorText = await response.text();
        console.error(`Server returned non-JSON response (${response.status}):`, errorText);
        errorMessage = `Server returned invalid response format`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Verify content type is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error("Server returned non-JSON content type:", contentType);
      const responseText = await response.text();
      console.error("Response body:", responseText);
      throw new Error('Server returned non-JSON response');
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

export async function exportEnhancedAttendanceCsv(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/enhanced-attendance/export/csv?${query}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/csv',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to export CSV');
  }
  const blob = await response.blob();
  return blob;
}
