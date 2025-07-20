
import { toast } from "sonner";
import { 
  ScheduleFilters, 
  TimeScheduleResponse, 
  MTIUserFilters, 
  MTIUserResponse, 
  FilterOptions,
  OrganizationHierarchy 
} from "@/types/schedule";

// Get API base URL based on environment configuration
const getApiBaseUrl = () => {
  const useRelativeUrl = import.meta.env.VITE_USE_RELATIVE_API_URL === 'true';
  return useRelativeUrl ? '/api' : import.meta.env.VITE_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

// Fetch schedule data using new MTIUsers table with enhanced filters
export const fetchMTIScheduleData = async (filters: MTIUserFilters): Promise<MTIUserResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add all filters to query params
    if (filters.search) params.append('search', filters.search);
    if (filters.department && filters.department !== 'all') params.append('department', filters.department);
    if (filters.division && filters.division !== 'all') params.append('division', filters.division);
    if (filters.section && filters.section !== 'all') params.append('section', filters.section);
    if (filters.dayType && filters.dayType !== 'all') params.append('dayType', filters.dayType);
    if (filters.timeInStatus && filters.timeInStatus !== 'all') params.append('timeInStatus', filters.timeInStatus);
    if (filters.timeOutStatus && filters.timeOutStatus !== 'all') params.append('timeOutStatus', filters.timeOutStatus);
    params.append('page', filters.page.toString());
    params.append('pageSize', filters.pageSize.toString());
    
    const response = await fetch(`${API_BASE_URL}/schedule?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching MTI schedule data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch MTI schedule data:', error);
    toast.error('Failed to load schedule data. Please try again.');
    return { 
      data: [], 
      total: 0, 
      page: 1, 
      pageSize: 10, 
      totalPages: 0,
      timeInStats: { available: 0, unavailable: 0 },
      timeOutStats: { available: 0, unavailable: 0 },
      organizationStats: { totalDepartments: 0, totalDivisions: 0, totalSections: 0, totalDayTypes: 0 }
    };
  }
};

// Fetch filter options for MTIUsers
export const fetchMTIFilterOptions = async (): Promise<FilterOptions> => {
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/filters`);
    
    if (!response.ok) {
      throw new Error(`Error fetching filter options: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    toast.error('Failed to load filter options.');
    return { departments: [], divisions: [], sections: [], dayTypes: [] };
  }
};

// Fetch organization hierarchy
export const fetchOrganizationHierarchy = async (): Promise<OrganizationHierarchy> => {
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/organization`);
    
    if (!response.ok) {
      throw new Error(`Error fetching organization hierarchy: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch organization hierarchy:', error);
    toast.error('Failed to load organization data.');
    return {};
  }
};

// Fetch employee details by ID
export const fetchEmployeeDetails = async (employeeId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/employee/${employeeId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching employee details: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch employee details:', error);
    toast.error('Failed to load employee details.');
    return null;
  }
};

// Legacy function for backward compatibility (uses old CardDBTimeSchedule)
export const fetchScheduleData = async (filters: ScheduleFilters): Promise<TimeScheduleResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add all filters to query params
    if (filters.search) params.append('search', filters.search);
    if (filters.department) params.append('department', filters.department);
    if (filters.timeInStatus && filters.timeInStatus !== 'all') params.append('timeInStatus', filters.timeInStatus);
    if (filters.timeOutStatus && filters.timeOutStatus !== 'all') params.append('timeOutStatus', filters.timeOutStatus);
    params.append('page', filters.page.toString());
    params.append('pageSize', filters.pageSize.toString());
    
    const response = await fetch(`${API_BASE_URL}/schedule/legacy?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching legacy schedule data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch legacy schedule data:', error);
    toast.error('Failed to load schedule data. Please try again.');
    return { data: [], total: 0 };
  }
};
