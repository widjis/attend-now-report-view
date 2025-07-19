import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Card,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { 
  Search as SearchIcon,
  AccessTime as TimeIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
} from "@mui/icons-material";

// Components
import PageHeader from "@/components/PageHeader";
import TimeScheduleTable from "@/components/TimeScheduleTable";

// API and Types
import { fetchScheduleData } from "@/api/scheduleApi";
import { getFilterOptions } from "@/api/attendanceApi";
import { ScheduleFilters } from "@/types/schedule";

const FilterCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[1],
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.primary.main}05 100%)`,
  border: `1px solid ${theme.palette.primary.main}20`,
}));

const StatItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[3],
  },
}));

const CardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const CardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

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

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "unavailable", label: "Not Available" },
  ];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <PageHeader
        title="Time Scheduling"
        subtitle="View employee time schedules"
        currentPage="schedule"
      />

      <FilterCard>
        <CardHeader>
          <Typography variant="h6" fontWeight={600}>
            Filters
          </Typography>
        </CardHeader>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={department}
                  label="Department"
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {filterOptions?.departments?.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time In Status</InputLabel>
                <Select
                  value={timeInStatus}
                  label="Time In Status"
                  onChange={(e) => setTimeInStatus(e.target.value as any)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={`time-in-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Out Status</InputLabel>
                <Select
                  value={timeOutStatus}
                  label="Time Out Status"
                  onChange={(e) => setTimeOutStatus(e.target.value as any)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={`time-out-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </FilterCard>

      {/* Statistics Section */}
      {data && (data.timeInStats || data.timeOutStats) && (
        <StatsCard elevation={2}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <TimeIcon color="primary" />
            <Typography variant="h6" fontWeight={600} color="primary">
              Time Schedule Statistics
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {data.timeInStats && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <StatItem>
                    <AvailableIcon sx={{ color: 'success.main', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {data.timeInStats.available}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time In Available
                      </Typography>
                    </Box>
                  </StatItem>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StatItem>
                    <UnavailableIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="warning.main">
                        {data.timeInStats.unavailable}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time In NA
                      </Typography>
                    </Box>
                  </StatItem>
                </Grid>
              </>
            )}
            
            {data.timeOutStats && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <StatItem>
                    <AvailableIcon sx={{ color: 'info.main', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="info.main">
                        {data.timeOutStats.available}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time Out Available
                      </Typography>
                    </Box>
                  </StatItem>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StatItem>
                    <UnavailableIcon sx={{ color: 'error.main', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="error.main">
                        {data.timeOutStats.unavailable}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time Out NA
                      </Typography>
                    </Box>
                  </StatItem>
                </Grid>
              </>
            )}
          </Grid>
          
          {/* Summary Row */}
          <Box mt={3} pt={3} borderTop={1} borderColor="divider">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" fontWeight={600}>
                    Total Time In:
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {(data.timeInStats?.available || 0) + (data.timeInStats?.unavailable || 0)} employees
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" fontWeight={600}>
                    Total Time Out:
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {(data.timeOutStats?.available || 0) + (data.timeOutStats?.unavailable || 0)} employees
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </StatsCard>
      )}

      <Card>
        <CardHeader>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems={isMobile ? "flex-start" : "center"}
            flexDirection={isMobile ? "column" : "row"}
            gap={2}
          >
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Employee Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data?.total || 0} total employees
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Items per page:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={pageSize.toString()}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                >
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="25">25</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                  <MenuItem value="100">100</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
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
    </>
  );
};
export default Schedule;
