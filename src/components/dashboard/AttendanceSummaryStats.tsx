
import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  useTheme,
  styled
} from "@mui/material";
import {
  People as UsersIcon,
  Schedule as ClockIcon,
  CheckCircle,
  Cancel as XCircleIcon
} from "@mui/icons-material";
import { AttendanceSummary } from "@/types/attendance";

const StyledStatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[3],
    transform: 'translateY(-2px)',
  },
}));

const IconContainer = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.primary.main + '20',
  color: theme.palette.primary.main,
}));

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  isLoading?: boolean;
  color?: 'primary' | 'success' | 'error' | 'warning';
}

const StatCard = ({ title, value, icon: Icon, description, isLoading, color = 'primary' }: StatCardProps) => {
  const theme = useTheme();
  
  const getColorStyles = () => {
    switch (color) {
      case 'success':
        return {
          backgroundColor: theme.palette.success.main + '20',
          color: theme.palette.success.main,
        };
      case 'error':
        return {
          backgroundColor: theme.palette.error.main + '20',
          color: theme.palette.error.main,
        };
      case 'warning':
        return {
          backgroundColor: theme.palette.warning.main + '20',
          color: theme.palette.warning.main,
        };
      default:
        return {
          backgroundColor: theme.palette.primary.main + '20',
          color: theme.palette.primary.main,
        };
    }
  };

  return (
    <StyledStatCard>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            {isLoading ? (
              <Skeleton variant="text" width={80} height={40} />
            ) : (
              <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                {value}
              </Typography>
            )}
            {description && (
              <Typography variant="caption" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          <IconContainer sx={getColorStyles()}>
            <Icon fontSize="medium" />
          </IconContainer>
        </Box>
      </CardContent>
    </StyledStatCard>
  );
};

interface AttendanceSummaryStatsProps {
  data?: AttendanceSummary;
  isLoading: boolean;
}

const AttendanceSummaryStats = ({ data, isLoading }: AttendanceSummaryStatsProps) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title="Total Records"
          value={data?.totalRecords ?? 0}
          icon={UsersIcon}
          isLoading={isLoading}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title="Clock Ins"
          value={data?.totalClockIn ?? 0}
          icon={ClockIcon}
          description="Total clock in events"
          isLoading={isLoading}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title="Valid Records"
          value={data?.validRecords ?? 0}
          icon={CheckCircle}
          description={`${data?.validPercentage ?? 0}% of total`}
          isLoading={isLoading}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title="Invalid Records"
          value={data?.invalidRecords ?? 0}
          icon={XCircleIcon}
          description={`${data?.invalidPercentage ?? 0}% of total`}
          isLoading={isLoading}
          color="error"
        />
      </Grid>
    </Grid>
  );
};

export default AttendanceSummaryStats;
