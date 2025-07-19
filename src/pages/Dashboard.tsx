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
  Grid,
  useTheme,
  useMediaQuery,
  Paper,
  styled
} from "@mui/material";
import {
  BarChart as ChartBarIcon,
  Schedule as ClockIcon
} from "@mui/icons-material";
import dayjs from "dayjs";

// Components
import PageHeader from "@/components/PageHeader";
import AttendanceByDateChart from "@/components/dashboard/AttendanceByDateChart";
import AttendanceByControllerChart from "@/components/dashboard/AttendanceByControllerChart";
import AttendanceStatusChart from "@/components/dashboard/AttendanceStatusChart";
import AttendanceSummaryStats from "@/components/dashboard/AttendanceSummaryStats";

// API
import { fetchAttendanceSummary } from "@/api/attendanceApi";
import { AttendanceTimeframe } from "@/types/attendance";

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
        <PageHeader
          title="Attendance Dashboard"
          subtitle="Summary of attendance records and analytics"
          currentPage="dashboard"
        />
        
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
