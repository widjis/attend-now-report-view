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

// API and Types
import { fetchScheduleData } from "@/api/scheduleApi";
import { getFilterOptions } from "@/api/attendanceApi";
import { ScheduleFilters } from "@/types/schedule";

const Schedule = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
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
  }, [searchTerm, department]);

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Employee Schedule</CardTitle>
              <div className="text-sm text-gray-500">
                {data && !isLoading ? 
                  `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, data.total)} of ${data.total} records` : 
                  'Loading records...'}
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
