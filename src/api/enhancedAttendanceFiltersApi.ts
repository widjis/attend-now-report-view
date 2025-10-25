import { toast } from "sonner";

// Get API base URL based on environment configuration
const getApiBaseUrl = () => {
  const useRelativeUrl = import.meta.env.VITE_USE_RELATIVE_API_URL === 'true';
  return useRelativeUrl ? '/api' : import.meta.env.VITE_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  departments: FilterOption[];
  companies: FilterOption[];
  cardTypes: FilterOption[];
}

// Fetch filter options for Enhanced Attendance
export const fetchEnhancedAttendanceFilterOptions = async (): Promise<FilterOptions> => {
  try {
    const response = await fetch(`${API_BASE_URL}/filters`);
    
    if (!response.ok) {
      throw new Error(`Error fetching filter options: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch enhanced attendance filter options:', error);
    toast.error('Failed to load filter options.');
    return { departments: [], companies: [], cardTypes: [] };
  }
};