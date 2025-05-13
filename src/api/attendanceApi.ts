
import { AttendanceFilters, AttendanceResponse, AttendanceSummary } from "../types/attendance";
import { toast } from "sonner";

// Base API URL - would come from environment variables in a real app
const API_BASE_URL = "https://api.example.com";

export const fetchAttendanceData = async (
  filters: AttendanceFilters
): Promise<AttendanceResponse> => {
  try {
    // In a real implementation, this would be an actual API call
    // For now, we'll return mock data
    console.log("Fetching attendance data with filters:", filters);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
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

    // Filter by search term if provided
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      mockResponse.data = mockResponse.data.filter((record) => 
        record.Name?.toLowerCase().includes(searchLower) || 
        record.Department?.toLowerCase().includes(searchLower) ||
        record.CardNo?.toLowerCase().includes(searchLower) ||
        record.StaffNo?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by department if provided
    if (filters.department) {
      mockResponse.data = mockResponse.data.filter(
        (record) => record.Department === filters.department
      );
    }

    // Filter by company if provided
    if (filters.company) {
      mockResponse.data = mockResponse.data.filter(
        (record) => record.Company === filters.company
      );
    }

    // Filter by cardType if provided
    if (filters.cardType) {
      mockResponse.data = mockResponse.data.filter(
        (record) => record.CardType === filters.cardType
      );
    }

    return mockResponse;
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    toast.error("Failed to fetch attendance data. Please try again.");
    throw error;
  }
};

export const fetchAttendanceSummary = async (startDate: string, endDate: string): Promise<AttendanceSummary> => {
  try {
    console.log(`Fetching attendance summary from ${startDate} to ${endDate}`);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    // Generate dates between start and end
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().split('T')[0]);
    }
    
    // Generate mock summary data
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
    
    // Calculate totals and percentages
    mockSummary.validPercentage = Math.round((mockSummary.validRecords / mockSummary.totalRecords) * 100);
    mockSummary.invalidPercentage = Math.round((mockSummary.invalidRecords / mockSummary.totalRecords) * 100);
    
    mockSummary.byController = mockSummary.byController.map(item => ({
      ...item,
      total: item.valid + item.invalid
    }));
    
    return mockSummary;
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    toast.error("Failed to fetch attendance summary data. Please try again.");
    throw error;
  }
};

export const exportAttendanceData = async (filters: AttendanceFilters, format: "csv" | "pdf"): Promise<void> => {
  try {
    console.log(`Exporting attendance data in ${format} format with filters:`, filters);
    
    // Simulate export process
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)), 
      {
        loading: `Preparing ${format.toUpperCase()} export...`,
        success: `Attendance data exported successfully as ${format.toUpperCase()}!`,
        error: "Export failed. Please try again.",
      }
    );
    
    // In a real implementation, we would:
    // 1. Make an API call to the backend to generate the export file
    // 2. Receive a file blob or download URL
    // 3. Trigger a download in the browser
    
    // For this mock, we'll just show a success message
  } catch (error) {
    console.error(`Error exporting attendance data as ${format}:`, error);
    toast.error(`Failed to export data as ${format.toUpperCase()}. Please try again.`);
    throw error;
  }
};

export const getFilterOptions = async () => {
  // In a real implementation, this would fetch available filter options from the API
  // For now, we'll return mock data
  return {
    departments: ["HR", "IT", "Finance", "Operations", "Marketing"],
    companies: ["Company 1", "Company 2", "Company 3"],
    cardTypes: ["Employee", "Contractor", "Visitor"],
  };
};
