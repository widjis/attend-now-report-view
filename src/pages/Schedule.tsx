
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Link } from "react-router-dom";

// Components
import TimeScheduleTable from "@/components/TimeScheduleTable";
import SearchBar from "@/components/SearchBar";
import FilterDropdown from "@/components/FilterDropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartBarIcon, ClipboardList } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// API and Types
import { fetchScheduleData } from "@/api/scheduleApi";
import { getFilterOptions } from "@/api/attendanceApi";
import { ScheduleFilters } from "@/types/schedule";

const Schedule = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("all");
  const [timeInStatus, setTimeInStatus] = useState<"available" | "unavailable" | "all">("all");
  const [timeOutStatus, setTimeOutStatus] = useState<"available" | "unavailable" | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Get filter options from API
  const { data: filterOptions } = useQuery({
    queryKey: ["filterOptions"],
    queryFn: getFilterOptions,
  });
  
  // Build filters object for API call
  const buildFilters = (): ScheduleFilters => {
    return {
      search: searchTerm,
      department: department === "all" ? undefined : department,
      timeInStatus,
      timeOutStatus,
      page,
      pageSize,
    };
  };

  // Fetch schedule data
  const { data, isLoading } = useQuery({
    queryKey: ["schedule", buildFilters()],
    queryFn: () => fetchScheduleData(buildFilters()),
  });

  // Handle filter changes
  React.useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, department, timeInStatus, timeOutStatus, pageSize]);

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
  };

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "unavailable", label: "Not Available" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Scheduling</h1>
            <p className="text-gray-500 mt-1">
              View employee time schedules
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ClipboardList size={16} />
                <span>Attendance Report</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search-field" className="text-sm font-medium mb-1 block">
                  Search
                </label>
                <SearchBar 
                  initialValue={searchTerm} 
                  onSearch={setSearchTerm} 
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

              <div>
                <label htmlFor="time-in-status" className="text-sm font-medium mb-1 block">
                  Time In Status
                </label>
                <Select value={timeInStatus} onValueChange={(value: "available" | "unavailable" | "all") => setTimeInStatus(value)}>
                  <SelectTrigger id="time-in-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={`time-in-${option.value}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="time-out-status" className="text-sm font-medium mb-1 block">
                  Time Out Status
                </label>
                <Select value={timeOutStatus} onValueChange={(value: "available" | "unavailable" | "all") => setTimeOutStatus(value)}>
                  <SelectTrigger id="time-out-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={`time-out-${option.value}`} value={option.value}>
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
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg">Employee Schedule</CardTitle>
                
                <div className="flex items-center gap-2">
                  {data?.timeInStats && (
                    <>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800">
                        Time In Available: {data.timeInStats.available}
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800">
                        Time In Unavailable: {data.timeInStats.unavailable}
                      </Badge>
                    </>
                  )}
                  {data?.timeOutStats && (
                    <>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
                        Time Out Available: {data.timeOutStats.available}
                      </Badge>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                        Time Out Unavailable: {data.timeOutStats.unavailable}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
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
                    `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, data.total)} of ${data.total} records` : 
                    'Loading records...'}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TimeScheduleTable 
              data={data?.data || []}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Schedule;
