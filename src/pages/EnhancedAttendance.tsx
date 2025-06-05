
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { Link } from "react-router-dom";

// Components
import EnhancedAttendanceTable from "@/components/EnhancedAttendanceTable";
import SearchBar from "@/components/SearchBar";
import FilterDropdown from "@/components/FilterDropdown";
import ExportButton from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartBarIcon, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateRangePicker from "@/components/DateRangePicker";

// API and Types
import { fetchEnhancedAttendanceData, exportEnhancedAttendanceCsv, exportEnhancedAttendancePdf } from "@/api/enhancedAttendanceApi";
import { getFilterOptions } from "@/api/attendanceApi";
import { EnhancedAttendanceFilters } from "@/types/enhancedAttendance";

const EnhancedAttendance = () => {
  // Get today's date and 7 days ago for default date range
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Format dates for API
  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // State for filters
  const [startDate, setStartDate] = useState<Date>(sevenDaysAgo);
  const [endDate, setEndDate] = useState<Date>(today);
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("all");
  const [scheduleType, setScheduleType] = useState<"Fixed" | "TwoShift_Day" | "TwoShift_Night" | "ThreeShift_Morning" | "ThreeShift_Afternoon" | "ThreeShift_Night" | "All">("All");
  const [clockInStatus, setClockInStatus] = useState<"Early" | "OnTime" | "Late" | "Missing" | "All">("All");
  const [clockOutStatus, setClockOutStatus] = useState<"Early" | "OnTime" | "Late" | "Missing" | "All">("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  
  // Get filter options from API
  const { data: filterOptions } = useQuery({
    queryKey: ["filterOptions"],
    queryFn: getFilterOptions,
  });
  
  // Build filters object for API call
  const buildFilters = (): EnhancedAttendanceFilters => {
    return {
      startDate: formatDateForApi(startDate),
      endDate: formatDateForApi(endDate),
      search: searchTerm,
      department: department === "all" ? undefined : department,
      scheduleType,
      clockInStatus,
      clockOutStatus,
      page,
      pageSize,
    };
  };

  // Fetch enhanced attendance data
  const { data, isLoading } = useQuery({
    queryKey: ["enhancedAttendance", buildFilters()],
    queryFn: () => fetchEnhancedAttendanceData(buildFilters()),
  });

  // Handle filter changes
  React.useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [startDate, endDate, searchTerm, department, scheduleType, clockInStatus, clockOutStatus, pageSize]);

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
  };

  // Handle export
  const handleExport = async (format: "csv" | "pdf") => {
    try {
      setIsExporting(true);
      
      // Build export parameters (without pagination)
      const exportParams = {
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
        search: searchTerm || undefined,
        department: department === "all" ? undefined : department,
        scheduleType: scheduleType === "All" ? undefined : scheduleType,
        clockInStatus: clockInStatus === "All" ? undefined : clockInStatus,
        clockOutStatus: clockOutStatus === "All" ? undefined : clockOutStatus,
      };

      // Remove undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(exportParams).filter(([_, value]) => value !== undefined)
      );

      let blob: Blob;
      let filename: string;
      
      if (format === "csv") {
        blob = await exportEnhancedAttendanceCsv(cleanParams);
        filename = `enhanced-attendance-${formatDateForApi(startDate)}-to-${formatDateForApi(endDate)}.csv`;
      } else {
        blob = await exportEnhancedAttendancePdf(cleanParams);
        filename = `enhanced-attendance-${formatDateForApi(startDate)}-to-${formatDateForApi(endDate)}.pdf`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} export completed successfully`);
    } catch (error) {
      console.error(`Export ${format} failed:`, error);
      toast.error(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Status filter options
  const statusOptions = [
    { value: "All", label: "All Statuses" },
    { value: "Early", label: "Early" },
    { value: "OnTime", label: "On Time" },
    { value: "Late", label: "Late" },
    { value: "Missing", label: "Missing" },
  ];

  // Updated schedule type options
  const scheduleTypeOptions = [
    { value: "All", label: "All Schedules" },
    { value: "Fixed", label: "Fixed (7-17)" },
    { value: "TwoShift_Day", label: "Two Shift - Day (7-19)" },
    { value: "TwoShift_Night", label: "Two Shift - Night (19-7)" },
    { value: "ThreeShift_Morning", label: "Three Shift - Morning (6-14)" },
    { value: "ThreeShift_Afternoon", label: "Three Shift - Afternoon (14-22)" },
    { value: "ThreeShift_Night", label: "Three Shift - Night (22-6)" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Report</h1>
            <p className="text-gray-500 mt-1">
              View combined schedule and actual attendance data
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/schedule">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Time Schedule</span>
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ChartBarIcon size={16} />
                <span>View Dashboard</span>
              </Button>
            </Link>
          </div>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="date-range" className="text-sm font-medium mb-1 block">
                  Date Range
                </label>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>

              <div>
                <label htmlFor="search-field" className="text-sm font-medium mb-1 block">
                  Search
                </label>
                <SearchBar 
                  initialValue={searchTerm} 
                  onSearch={setSearchTerm} 
                  placeholder="Search by name or ID..."
                />
              </div>

              <div>
                <FilterDropdown 
                  label="Department"
                  value={department}
                  onChange={setDepartment}
                  options={filterOptions?.departments || []}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="schedule-type" className="text-sm font-medium mb-1 block">
                  Schedule Type
                </label>
                <Select 
                  value={scheduleType} 
                  onValueChange={(value: "Fixed" | "TwoShift_Day" | "TwoShift_Night" | "ThreeShift_Morning" | "ThreeShift_Afternoon" | "ThreeShift_Night" | "All") => setScheduleType(value)}
                >
                  <SelectTrigger id="schedule-type">
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleTypeOptions.map((option) => (
                      <SelectItem key={`schedule-${option.value}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="clock-in-status" className="text-sm font-medium mb-1 block">
                  Clock In Status
                </label>
                <Select 
                  value={clockInStatus}
                  onValueChange={(value: "Early" | "OnTime" | "Late" | "Missing" | "All") => setClockInStatus(value)}
                >
                  <SelectTrigger id="clock-in-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={`clock-in-${option.value}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="clock-out-status" className="text-sm font-medium mb-1 block">
                  Clock Out Status
                </label>
                <Select 
                  value={clockOutStatus}
                  onValueChange={(value: "Early" | "OnTime" | "Late" | "Missing" | "All") => setClockOutStatus(value)}
                >
                  <SelectTrigger id="clock-out-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={`clock-out-${option.value}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-y-2">
              <CardTitle className="text-lg">Attendance Records</CardTitle>
              
              <div className="flex items-center gap-3">
                <ExportButton 
                  onExport={handleExport}
                  isLoading={isExporting}
                  disabled={!data || data.total === 0}
                />
                
                <div className="flex items-center gap-2">
                  <label htmlFor="page-size" className="text-sm text-gray-600 whitespace-nowrap">
                    Items per page:
                  </label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger id="page-size" className="w-20 h-8">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-gray-500">
                  {data && !isLoading ? 
                    `Showing ${data.total > 0 ? (page - 1) * pageSize + 1 : 0}-${Math.min(page * pageSize, data.total)} of ${data.total} records` : 
                    'Loading records...'}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EnhancedAttendanceTable 
              data={data?.data || []}
              isLoading={isLoading}
              currentPage={page}
              totalPages={data?.totalPages || 1}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedAttendance;
