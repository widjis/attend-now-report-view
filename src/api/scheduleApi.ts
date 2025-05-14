
import { toast } from "sonner";
import { ScheduleFilters, TimeScheduleResponse } from "@/types/schedule";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch schedule data with filters
export const fetchScheduleData = async (filters: ScheduleFilters): Promise<TimeScheduleResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add all filters to query params
    if (filters.search) params.append('search', filters.search);
    if (filters.department) params.append('department', filters.department);
    params.append('page', filters.page.toString());
    params.append('pageSize', filters.pageSize.toString());
    
    const response = await fetch(`${API_BASE_URL}/schedule?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching schedule data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch schedule data:', error);
    toast.error('Failed to load schedule data. Please try again.');
    return { data: [], total: 0 };
  }
};
