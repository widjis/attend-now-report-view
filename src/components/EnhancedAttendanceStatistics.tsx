import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Skeleton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { EnhancedAttendanceRecord } from '@/types/enhancedAttendance';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  percentage?: number;
}

interface EnhancedAttendanceStatisticsProps {
  data: EnhancedAttendanceRecord[];
  isLoading: boolean;
  totalRecords: number;
}

// Styled components
const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
}));

const IconBox = styled(Box)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '50%',
  backgroundColor: bgcolor,
  color: theme.palette.common.white,
  marginRight: theme.spacing(2),
}));

const PercentageChip = styled(Chip)<{ ispositive: 'true' | 'false' }>(({ theme, ispositive }) => ({
  backgroundColor: ispositive === 'true' ? theme.palette.success.light : theme.palette.error.light,
  color: ispositive === 'true' ? theme.palette.success.dark : theme.palette.error.dark,
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24,
}));

const StatCardContent = ({ title, value, icon, color, percentage }: StatCardProps) => {
  return (
    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconBox bgcolor={color}>{icon}</IconBox>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Box>

      <Box display="flex" alignItems="baseline" mt="auto">
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {value}
        </Typography>
      </Box>

      {percentage !== undefined && (
        <Box display="flex" alignItems="center" mt={1}>
          <PercentageChip
            ispositive={percentage >= 0 ? 'true' : 'false'}
            label={`${percentage}%`}
            size="small"
          />
        </Box>
      )}
    </CardContent>
  );
};

const EnhancedAttendanceStatistics: React.FC<EnhancedAttendanceStatisticsProps> = ({
  data,
  isLoading,
  totalRecords,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Calculate statistics
  const calculateStats = () => {
    if (!data || data.length === 0) {
      return {
        totalEmployees: 0,
        onTimeClockIns: 0,
        lateClockIns: 0,
        missingClockIns: 0,
        onTimeClockOuts: 0,
        earlyClockOuts: 0,
        missingClockOuts: 0,
      };
    }

    // Get unique employees
    const uniqueEmployees = new Set(data.map((record) => record.StaffNo));

    // Count clock in statuses
    const onTimeClockIns = data.filter((record) => record.ClockInStatus === 'OnTime').length;
    const lateClockIns = data.filter((record) => record.ClockInStatus === 'Late').length;
    const missingClockIns = data.filter((record) => 
      record.ClockInStatus === 'Missing' || record.ClockInStatus === 'Out of Range'
    ).length;

    // Count clock out statuses
    const onTimeClockOuts = data.filter((record) => record.ClockOutStatus === 'OnTime').length;
    const earlyClockOuts = data.filter((record) => record.ClockOutStatus === 'Early').length;
    const missingClockOuts = data.filter((record) => 
      record.ClockOutStatus === 'Missing' || record.ClockOutStatus === 'Out of Range'
    ).length;

    return {
      totalEmployees: uniqueEmployees.size,
      onTimeClockIns,
      lateClockIns,
      missingClockIns,
      onTimeClockOuts,
      earlyClockOuts,
      missingClockOuts,
    };
  };

  const stats = calculateStats();

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card sx={{ mb: 3, borderRadius: theme.shape.borderRadius * 2 }}>
        <CardContent>
          <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3, borderRadius: theme.shape.borderRadius * 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Attendance Statistics
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Total Employees */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent
                title="Total Employees"
                value={stats.totalEmployees}
                icon={<AccessTimeIcon />}
                color={theme.palette.primary.main}
              />
            </StatCard>
          </Grid>

          {/* On-Time Clock Ins */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent
                title="On-Time Clock Ins"
                value={stats.onTimeClockIns}
                icon={<CheckCircleIcon />}
                color={theme.palette.success.main}
                percentage={data.length > 0 ? Math.round((stats.onTimeClockIns / data.length) * 100) : 0}
              />
            </StatCard>
          </Grid>

          {/* Late Clock Ins */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent
                title="Late Clock Ins"
                value={stats.lateClockIns}
                icon={<WarningIcon />}
                color={theme.palette.warning.main}
                percentage={data.length > 0 ? Math.round((stats.lateClockIns / data.length) * 100) : 0}
              />
            </StatCard>
          </Grid>

          {/* Missing Clock Ins */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent
                title="Missing Clock Ins"
                value={stats.missingClockIns}
                icon={<CancelIcon />}
                color={theme.palette.error.main}
                percentage={data.length > 0 ? Math.round((stats.missingClockIns / data.length) * 100) : 0}
              />
            </StatCard>
          </Grid>

          {/* On-Time Clock Outs */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent
                title="On-Time Clock Outs"
                value={stats.onTimeClockOuts}
                icon={<CheckCircleIcon />}
                color={theme.palette.success.main}
                percentage={data.length > 0 ? Math.round((stats.onTimeClockOuts / data.length) * 100) : 0}
              />
            </StatCard>
          </Grid>

          {/* Early Clock Outs */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent
                title="Early Clock Outs"
                value={stats.earlyClockOuts}
                icon={<WarningIcon />}
                color={theme.palette.warning.main}
                percentage={data.length > 0 ? Math.round((stats.earlyClockOuts / data.length) * 100) : 0}
              />
            </StatCard>
          </Grid>

          {/* Missing Clock Outs */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent
                title="Missing Clock Outs"
                value={stats.missingClockOuts}
                icon={<ErrorIcon />}
                color={theme.palette.error.main}
                percentage={data.length > 0 ? Math.round((stats.missingClockOuts / data.length) * 100) : 0}
              />
            </StatCard>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EnhancedAttendanceStatistics;