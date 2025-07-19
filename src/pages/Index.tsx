
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Grid,
  Paper
} from "@mui/material";
import { BarChart, Schedule } from "@mui/icons-material";

// Components
import DateRangePicker from "@/components/DateRangePicker";
import SearchBar from "@/components/SearchBar";
import FilterDropdown from "@/components/FilterDropdown";
import ExportButton from "@/components/ExportButton";
import AttendanceTable from "@/components/AttendanceTable";
import { DateRange } from "react-day-picker";

// API and Types
import { 
  fetchAttendanceData, 
  exportAttendanceData, 
  getFilterOptions 
} from "@/api/attendanceApi";
import { AttendanceFilters } from "@/types/attendance";

const Index = () => {
  // Default to last 7 days
  const today = dayjs().toDate();
  const defaultDateRange: DateRange = {
    from: dayjs().subtract(7, 'day').toDate(),
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
      startDate: dateRange?.from ? dayjs(dateRange.from).format("YYYY-MM-DD") : dayjs().subtract(7, 'day').format("YYYY-MM-DD"),
      endDate: dateRange?.to ? dayjs(dateRange.to).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
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
    <Container maxWidth="xl" sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />

      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Box component="header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'grey.900' }}>
              Attendance Report
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              View and export attendance records from the database
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              to="/schedule"
              variant="outlined"
              startIcon={<Schedule />}
            >
              Time Scheduling
            </Button>
            <Button
              component={Link}
              to="/dashboard"
              variant="outlined"
              startIcon={<BarChart />}
            >
              View Dashboard
            </Button>
          </Box>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Filters
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6} lg={3}>
                <DateRangePicker 
                  startDate={dateRange?.from || dayjs().subtract(7, 'day').toDate()}
                  endDate={dateRange?.to || dayjs().toDate()}
                  onStartDateChange={(date) => setDateRange(range => ({ ...range, from: date }))}
                  onEndDateChange={(date) => setDateRange(range => ({ ...range, to: date }))}
                />
              </Grid>

              <Grid item xs={12} md={6} lg={6}>
                <SearchBar 
                  initialValue={searchTerm} 
                  onSearch={setSearchTerm} 
                />
              </Grid>

              <Grid item xs={12} md={6} lg={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ExportButton 
                  onExport={handleExport} 
                  isLoading={isExporting}
                  disabled={isLoading || !data || data.data.length === 0}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FilterDropdown 
                  label="Department"
                  value={department}
                  onChange={setDepartment}
                  options={filterOptions?.departments || []}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FilterDropdown 
                  label="Company"
                  value={company}
                  onChange={setCompany}
                  options={filterOptions?.companies || []}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FilterDropdown 
                  label="Card Type"
                  value={cardType}
                  onChange={setCardType}
                  options={filterOptions?.cardTypes || []}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Attendance Records
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data && !isLoading ? 
                  `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, data.total)} of ${data.total} records` : 
                  'Loading records...'}
              </Typography>
            </Box>
            <AttendanceTable 
              data={data?.data || []}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Index;
