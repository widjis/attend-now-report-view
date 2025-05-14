
import React, { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Link } from "react-router-dom";

// Components
import DateRangePicker from "@/components/DateRangePicker";
import SearchBar from "@/components/SearchBar";
import FilterDropdown from "@/components/FilterDropdown";
import ExportButton from "@/components/ExportButton";
import AttendanceTable from "@/components/AttendanceTable";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartBarIcon, Clock } from "lucide-react";

// API and Types
import { 
  fetchAttendanceData, 
  exportAttendanceData, 
  getFilterOptions 
} from "@/api/attendanceApi";
import { AttendanceFilters } from "@/types/attendance";

const Index = () => {
  // Default to last 7 days
  const today = new Date();
  const defaultDateRange: DateRange = {
    from: subDays(today, 7),
    to: today
  };

  // State for filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("all");
  const [company, setCompany] = useState("all");
  const [cardType, setCardType] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  
  // Get filter options from API
  const { data: filterOptions } = useQuery({
    queryKey: ["filterOptions"],
    queryFn: getFilterOptions,
  });
  
  // Build filters object for API call
  const buildFilters = (): AttendanceFilters => {
    return {
      startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : format(subDays(today, 7), "yyyy-MM-dd"),
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : format(today, "yyyy-MM-dd"),
      search: searchTerm,
      department: department === "all" ? undefined : department,
      company: company === "all" ? undefined : company,
      cardType: cardType === "all" ? undefined : cardType,
      page,
      pageSize,
    };
  };

  // Fetch attendance data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["attendance", buildFilters()],
    queryFn: () => fetchAttendanceData(buildFilters()),
  });

  // Handle filter changes
  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [dateRange, searchTerm, department, company, cardType]);

  // Handle export
  const handleExport = async (format: "csv" | "pdf") => {
    setIsExporting(true);
    try {
      await exportAttendanceData(buildFilters(), format);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Report</h1>
            <p className="text-gray-500 mt-1">
              View and export attendance records from the database
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/schedule">
              <Button variant="outline" className="flex items-center gap-2">
                <Clock size={16} />
                <span>Time Scheduling</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <DateRangePicker 
                startDate={dateRange?.from || subDays(today, 7)}
                endDate={dateRange?.to || today}
                onStartDateChange={(date) => setDateRange(range => ({ ...range, from: date }))}
                onEndDateChange={(date) => setDateRange(range => ({ ...range, to: date }))}
              />

              <div className="lg:col-span-2">
                <SearchBar 
                  initialValue={searchTerm} 
                  onSearch={setSearchTerm} 
                />
              </div>

              <div className="flex justify-end">
                <ExportButton 
                  onExport={handleExport} 
                  isLoading={isExporting}
                  disabled={isLoading || !data || data.data.length === 0}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FilterDropdown 
                label="Department"
                value={department}
                onChange={setDepartment}
                options={filterOptions?.departments || []}
              />
              <FilterDropdown 
                label="Company"
                value={company}
                onChange={setCompany}
                options={filterOptions?.companies || []}
              />
              <FilterDropdown 
                label="Card Type"
                value={cardType}
                onChange={setCardType}
                options={filterOptions?.cardTypes || []}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Attendance Records</CardTitle>
              <div className="text-sm text-gray-500">
                {data && !isLoading ? 
                  `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, data.total)} of ${data.total} records` : 
                  'Loading records...'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AttendanceTable 
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

export default Index;
