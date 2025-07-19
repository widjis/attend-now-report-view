import React, { useState } from "react";
import { subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  Paper,
  Breadcrumbs,
  Link,
  styled
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Schedule as ClockIcon,
  BarChart as ChartBarIcon,
  Home as HomeIcon
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";

// Chart components
import AttendanceByDateChart from "@/components/dashboard/AttendanceByDateChart";
import AttendanceByControllerChart from "@/components/dashboard/AttendanceByControllerChart";
import AttendanceStatusChart from "@/components/dashboard/AttendanceStatusChart";
import AttendanceSummaryStats from "@/components/dashboard/AttendanceSummaryStats";

// API
import { fetchAttendanceSummary } from "@/api/attendanceApi";
import { AttendanceTimeframe } from "@/types/attendance";

// Styled components
const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiBreadcrumbs-separator': {
    color: theme.palette.text.secondary,
  },
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(2),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  transition: 'box-shadow 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  '& .MuiCardHeader-title': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '1.25rem',
    fontWeight: 600,
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState<AttendanceTimeframe>("week");
  const [tabValue, setTabValue] = useState(1); // Default to "week" (index 1)
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Calculate date range based on selected timeframe
  const getDateRange = () => {
    const today = new Date();
    
    switch(timeframe) {
      case "day":
        return {
          startDate: dayjs(today).format("YYYY-MM-DD"),
          endDate: dayjs(today).format("YYYY-MM-DD")
        };
      case "week":
        return {
          startDate: dayjs(startOfWeek(today, { weekStartsOn: 1 })).format("YYYY-MM-DD"),
          endDate: dayjs(endOfWeek(today, { weekStartsOn: 1 })).format("YYYY-MM-DD")
        };
      case "month":
        return {
          startDate: dayjs(startOfMonth(today)).format("YYYY-MM-DD"),
          endDate: dayjs(endOfMonth(today)).format("YYYY-MM-DD")
        };
      case "quarter":
        return {
          startDate: dayjs(subMonths(today, 3)).format("YYYY-MM-DD"),
          endDate: dayjs(today).format("YYYY-MM-DD")
        };
      default:
        return {
          startDate: dayjs(subDays(today, 7)).format("YYYY-MM-DD"),
          endDate: dayjs(today).format("YYYY-MM-DD")
        };
    }
  };
  
  const dateRange = getDateRange();
  
  // Fetch summary data
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["attendance-summary", timeframe],
    queryFn: () => fetchAttendanceSummary(dateRange.startDate, dateRange.endDate),
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const timeframes: AttendanceTimeframe[] = ["day", "week", "month", "quarter"];
    setTimeframe(timeframes[newValue]);
  };
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3 }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <StyledBreadcrumbs aria-label="breadcrumb">
          <Link
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography 
            color="text.primary" 
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Typography>
        </StyledBreadcrumbs>

        {/* Header */}
        <HeaderCard elevation={0}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems={isMobile ? "flex-start" : "center"}
            flexDirection={isMobile ? "column" : "row"}
            gap={2}
          >
            <Box>
              <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
                Attendance Dashboard
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Summary of attendance records and analytics
              </Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                component={RouterLink}
                to="/enhanced-attendance"
                variant="contained"
                color="secondary"
                startIcon={<CalendarIcon />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                View Attendance
              </Button>
              <Button
                component={RouterLink}
                to="/schedule"
                variant="contained"
                color="secondary"
                startIcon={<ClockIcon />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Schedule
              </Button>
            </Box>
          </Box>
        </HeaderCard>
        
        {/* Timeframe Tabs */}
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                },
              }}
            >
              <Tab label="Day" />
              <Tab label="Week" />
              <Tab label="Month" />
              <Tab label="Quarter" />
            </Tabs>
          </Paper>
        </Box>
        
        <TabPanel value={tabValue} index={tabValue}>
          {/* Summary Stats */}
          <Box sx={{ mb: 3 }}>
            <StyledCard>
              <StyledCardHeader
                title={
                  <>
                    <ClockIcon />
                    Summary Stats
                  </>
                }
              />
              <CardContent>
                <AttendanceSummaryStats data={summaryData} isLoading={isLoading} />
              </CardContent>
            </StyledCard>
          </Box>
          
          {/* Charts Grid */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={6}>
              <StyledCard>
                <StyledCardHeader
                  title={
                    <>
                      <ChartBarIcon />
                      Attendance by Date
                    </>
                  }
                />
                <CardContent>
                  <AttendanceByDateChart data={summaryData?.byDate} isLoading={isLoading} />
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} lg={6}>
              <StyledCard>
                <StyledCardHeader
                  title={
                    <>
                      <ChartBarIcon />
                      Status Distribution
                    </>
                  }
                />
                <CardContent>
                  <AttendanceStatusChart data={summaryData?.byStatus} isLoading={isLoading} />
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
          
          {/* Controller Chart */}
          <StyledCard>
            <StyledCardHeader
              title={
                <>
                  <ChartBarIcon />
                  Attendance by Controller
                </>
              }
            />
            <CardContent>
              <AttendanceByControllerChart data={summaryData?.byController} isLoading={isLoading} />
            </CardContent>
          </StyledCard>
        </TabPanel>
      </Container>
    </Box>
  );
};

export default Dashboard;
