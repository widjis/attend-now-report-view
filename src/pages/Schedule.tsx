import React, { useState, useMemo } from "react";
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
  Alert,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { 
  Search as SearchIcon,
  AccessTime as TimeIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

// Components
import PageHeader from "@/components/PageHeader";
import TimeScheduleTable from "@/components/TimeScheduleTable";

// API and Types
import { 
  fetchMTIScheduleData, 
  fetchMTIFilterOptions,
  fetchOrganizationHierarchy 
} from "@/api/scheduleApi";
import { getFilterOptions } from "@/api/attendanceApi";
import { MTIUserFilters, FilterOptions } from "@/types/schedule";

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
  const [filters, setFilters] = useState<MTIUserFilters>({
    search: "",
    department: "all",
    division: "all",
    section: "all",
    dayType: "all",
    timeInStatus: "all",
    timeOutStatus: "all",
    page: 1,
    pageSize: 10,
  });
  
  // Fetch schedule data using new MTIUsers API
  const { 
    data, 
    isLoading, 
    error: scheduleError,
    refetch: refetchSchedule 
  } = useQuery({
    queryKey: ["mti-schedule", filters],
    queryFn: () => fetchMTIScheduleData(filters),
    staleTime: 30000, // 30 seconds
  });

  // Fetch filter options
  const { 
    data: filterOptions, 
    isLoading: isLoadingFilters 
  } = useQuery({
    queryKey: ["mti-filter-options"],
    queryFn: fetchMTIFilterOptions,
    staleTime: 300000, // 5 minutes
  });

  // Fetch organization hierarchy
  const { 
    data: organizationData, 
    isLoading: isLoadingOrganization 
  } = useQuery({
    queryKey: ["organization-hierarchy"],
    queryFn: fetchOrganizationHierarchy,
    staleTime: 300000, // 5 minutes
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof MTIUserFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : Number(value), // Reset to page 1 when other filters change, ensure page is number
    }));
  };

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / filters.pageSize) : 0;

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    handleFilterChange('pageSize', parseInt(value));
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data) return null;
    
    return {
      totalEmployees: data.total,
      timeInAvailable: data.timeInStats.available,
      timeInUnavailable: data.timeInStats.unavailable,
      timeOutAvailable: data.timeOutStats.available,
      timeOutUnavailable: data.timeOutStats.unavailable,
      organizationStats: data.organizationStats,
    };
  }, [data]);

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "unavailable", label: "Not Available" },
  ];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Error state
  if (scheduleError) {
    return (
      <>
        <PageHeader
          title="Time Scheduling"
          subtitle="View employee time schedules"
          currentPage="schedule"
        />
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load schedule data. Please try again.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Time Scheduling"
        subtitle="View employee time schedules"
        currentPage="schedule"
        action={
          <Button
            onClick={() => refetchSchedule()}
            variant="outlined"
            size="small"
            disabled={isLoading}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        }
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
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  label="Department"
                  onChange={(e) => handleFilterChange('department', e.target.value)}
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
                <InputLabel>Division</InputLabel>
                <Select
                  value={filters.division}
                  label="Division"
                  onChange={(e) => handleFilterChange('division', e.target.value)}
                >
                  <MenuItem value="all">All Divisions</MenuItem>
                  {filterOptions?.divisions?.map((div) => (
                    <MenuItem key={div} value={div}>
                      {div}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Section</InputLabel>
                <Select
                  value={filters.section}
                  label="Section"
                  onChange={(e) => handleFilterChange('section', e.target.value)}
                >
                  <MenuItem value="all">All Sections</MenuItem>
                  {filterOptions?.sections?.map((sec) => (
                    <MenuItem key={sec} value={sec}>
                      {sec}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Day Type</InputLabel>
                <Select
                  value={filters.dayType}
                  label="Day Type"
                  onChange={(e) => handleFilterChange('dayType', e.target.value)}
                >
                  <MenuItem value="all">All Days</MenuItem>
                  <MenuItem value="weekday">Weekdays</MenuItem>
                  <MenuItem value="weekend">Weekends</MenuItem>
                  <MenuItem value="holiday">Holidays</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time In Status</InputLabel>
                <Select
                  value={filters.timeInStatus}
                  label="Time In Status"
                  onChange={(e) => handleFilterChange('timeInStatus', e.target.value)}
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
                  value={filters.timeOutStatus}
                  label="Time Out Status"
                  onChange={(e) => handleFilterChange('timeOutStatus', e.target.value)}
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
      {stats && (
        <StatsCard elevation={2}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <TimeIcon color="primary" />
            <Typography variant="h6" fontWeight={600} color="primary">
              Time Schedule Statistics
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatItem>
                <AvailableIcon sx={{ color: 'success.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats.timeInAvailable}
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
                    {stats.timeInUnavailable}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time In NA
                  </Typography>
                </Box>
              </StatItem>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatItem>
                <AvailableIcon sx={{ color: 'info.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {stats.timeOutAvailable}
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
                    {stats.timeOutUnavailable}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time Out NA
                  </Typography>
                </Box>
              </StatItem>
            </Grid>
          </Grid>
          
          {/* Organization Statistics */}
          {stats.organizationStats && (
            <Box mt={3} pt={3} borderTop={1} borderColor="divider">
              <Typography variant="h6" fontWeight={600} mb={2}>
                Organization Breakdown
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(stats.organizationStats).map(([org, count]) => (
                  <Grid item xs={12} sm={6} md={4} key={org}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" fontWeight={600}>
                        {org}:
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {count} employees
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {/* Summary Row */}
          <Box mt={3} pt={3} borderTop={1} borderColor="divider">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" fontWeight={600}>
                    Total Time In:
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stats.timeInAvailable + stats.timeInUnavailable} employees
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" fontWeight={600}>
                    Total Time Out:
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stats.timeOutAvailable + stats.timeOutUnavailable} employees
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
                  value={filters.pageSize.toString()}
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
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => handleFilterChange('page', page)}
          />
        </CardContent>
      </Card>
    </>
  );
};
export default Schedule;
