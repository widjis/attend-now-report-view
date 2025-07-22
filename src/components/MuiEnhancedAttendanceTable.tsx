import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Pagination,
  Skeleton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Divider,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { EnhancedAttendanceRecord } from "@/types/enhancedAttendance";
import { statusColors, scheduleColors } from "@/theme/muiTheme";
import { format } from "date-fns";

interface EnhancedAttendanceTableProps {
  data: EnhancedAttendanceRecord[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  overflow: 'auto',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StatusChip = styled(Chip)<{ statustype: string }>(({ theme, statustype }) => {
  const colors = statusColors[statustype as keyof typeof statusColors] || statusColors.missing;
  return {
    backgroundColor: colors.background,
    color: colors.main,
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    '& .MuiChip-label': {
      padding: '0 8px',
    },
  };
});

const ScheduleChip = styled(Chip)<{ scheduletype: string }>(({ theme, scheduletype }) => {
  const colors = scheduleColors[scheduletype as keyof typeof scheduleColors] || scheduleColors.Fixed;
  return {
    backgroundColor: colors.background,
    color: colors.main,
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 28,
    '& .MuiChip-label': {
      padding: '0 12px',
    },
  };
});

const HighlightedCell = styled(TableCell)<{ highlight?: 'late' | 'early' | 'out-of-range' }>(({ theme, highlight }) => ({
  backgroundColor: highlight === 'late' 
    ? 'rgba(244, 67, 54, 0.05)' 
    : highlight === 'early' 
    ? 'rgba(255, 193, 7, 0.05)' 
    : highlight === 'out-of-range'
    ? 'rgba(244, 67, 54, 0.15)'
    : 'transparent',
}));

const EnhancedAttendanceTable: React.FC<EnhancedAttendanceTableProps> = ({
  data,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Display skeleton loader while loading
  if (isLoading) {
    return (
      <Box className={className}>
        <Paper>
          <StyledTableContainer>
            <Table>
              <StyledTableHead>
                <TableRow>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Department</StyledTableCell>
                  {!isMobile && <StyledTableCell>Position</StyledTableCell>}
                  <StyledTableCell>Date</StyledTableCell>
                  <StyledTableCell>Schedule</StyledTableCell>
                  <StyledTableCell>C IN (Schedule)</StyledTableCell>
                  <StyledTableCell>C OUT (Schedule)</StyledTableCell>
                  <StyledTableCell>Actual C IN</StyledTableCell>
                  <StyledTableCell>Actual C OUT</StyledTableCell>
                  {!isMobile && <StyledTableCell>Controller</StyledTableCell>}
                  <StyledTableCell>Status</StyledTableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: isMobile ? 8 : 11 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" width="100%" height={24} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </Paper>
      </Box>
    );
  }

  // Display empty state
  if (data.length === 0) {
    return (
      <Box 
        className={className}
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        p={4}
        component={Paper}
        sx={{ textAlign: 'center', minHeight: 200 }}
      >
        <Typography variant="h6" color="text.primary" gutterBottom>
          No attendance records found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your date range or search criteria
        </Typography>
      </Box>
    );
  }

  // Format time
  const formatTime = (timeString: string | null): string => {
    if (!timeString) return "N/A";
    const match = timeString.match(/(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    return timeString;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Get schedule type display
  const getScheduleTypeDisplay = (type: string | null | undefined) => {
    if (!type) return <ScheduleChip scheduletype="Fixed" label="Unknown" size="small" />;
    
    const labels = {
      Fixed: "Fixed 7-17",
      TwoShift_Day: "2-Shift Day",
      TwoShift_Night: "2-Shift Night",
      ThreeShift_Morning: "3-Shift Morning",
      ThreeShift_Afternoon: "3-Shift Afternoon",
      ThreeShift_Night: "3-Shift Night",
    };
    
    return (
      <ScheduleChip 
        scheduletype={type} 
        label={labels[type as keyof typeof labels] || type} 
        size="small" 
      />
    );
  };

  // Card view for mobile
  const renderMobileCardView = () => {
    return (
      <Grid container spacing={2}>
        {data.map((record, index) => (
          <Grid item xs={12} key={index}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: 2,
              '&:nth-of-type(odd)': { 
                borderLeft: `4px solid ${theme.palette.primary.main}` 
              },
              '&:nth-of-type(even)': { 
                borderLeft: `4px solid ${theme.palette.secondary.main}` 
              }
            }}>
              <CardContent>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="h6" component="div" fontWeight={600}>
                    {record.Name || "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {record.Department || "N/A"}{record.Position ? ` • ${record.Position}` : ""}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(record.Date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Schedule</Typography>
                    {getScheduleTypeDisplay(record.ScheduleType)}
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Schedule Time</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>IN:</Typography>
                        <Typography variant="body1" fontFamily="monospace" fontWeight={500}>
                          {formatTime(record.ScheduledClockIn)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>OUT:</Typography>
                        <Typography variant="body1" fontFamily="monospace" fontWeight={500}>
                          {formatTime(record.ScheduledClockOut)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Actual Time</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: record.ClockInStatus === 'Out of Range' 
                          ? 'rgba(244, 67, 54, 0.15)' 
                          : record.ClockInStatus === 'Late' 
                          ? 'rgba(244, 67, 54, 0.05)' 
                          : 'transparent'
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>IN:</Typography>
                        <Typography variant="body1" fontFamily="monospace" fontWeight={500}>
                          {formatTime(record.ActualClockIn)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: record.ClockOutStatus === 'Out of Range' 
                          ? 'rgba(244, 67, 54, 0.15)' 
                          : record.ClockOutStatus === 'Early' 
                          ? 'rgba(255, 193, 7, 0.05)' 
                          : 'transparent'
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>OUT:</Typography>
                        <Typography variant="body1" fontFamily="monospace" fontWeight={500}>
                          {formatTime(record.ActualClockOut)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Status</Typography>
                  <Stack direction="row" spacing={1}>
                    {record.ClockInStatus && (
                      <StatusChip 
                        statustype={record.ClockInStatus.toLowerCase()}
                        label={`IN: ${record.ClockInStatus}`}
                        size="small"
                      />
                    )}
                    {record.ClockOutStatus && (
                      <StatusChip 
                        statustype={record.ClockOutStatus.toLowerCase()}
                        label={`OUT: ${record.ClockOutStatus}`}
                        size="small"
                      />
                    )}
                  </Stack>
                </Box>
                
                {(record.ClockInController || record.ClockOutController) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Controller</Typography>
                    <Typography variant="body2">
                      {record.ClockInController || record.ClockOutController || "N/A"}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Table view for desktop
  const renderDesktopTableView = () => {
    return (
      <Paper>
        <StyledTableContainer>
          <Table stickyHeader>
            <StyledTableHead>
              <TableRow>
                <StyledTableCell>Name</StyledTableCell>
                <StyledTableCell>Department</StyledTableCell>
                <StyledTableCell>Position</StyledTableCell>
                <StyledTableCell>Date</StyledTableCell>
                <StyledTableCell>Schedule</StyledTableCell>
                <StyledTableCell>C IN (Schedule)</StyledTableCell>
                <StyledTableCell>C OUT (Schedule)</StyledTableCell>
                <StyledTableCell>Actual C IN</StyledTableCell>
                <StyledTableCell>Actual C OUT</StyledTableCell>
                <StyledTableCell>Controller</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {data.map((record, index) => (
                <TableRow 
                  key={index} 
                  hover
                  sx={{ 
                    '&:nth-of-type(odd)': { 
                      backgroundColor: theme.palette.action.hover 
                    } 
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {record.Name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {record.Department || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {record.Position || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(record.Date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getScheduleTypeDisplay(record.ScheduleType)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {formatTime(record.ScheduledClockIn)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {formatTime(record.ScheduledClockOut)}
                    </Typography>
                  </TableCell>
                  <HighlightedCell highlight={
                    record.ClockInStatus === 'Out of Range' ? 'out-of-range' :
                    record.ClockInStatus === 'Late' ? 'late' : undefined
                  }>
                    <Typography variant="body2" fontFamily="monospace">
                      {formatTime(record.ActualClockIn)}
                    </Typography>
                  </HighlightedCell>
                  <HighlightedCell highlight={
                    record.ClockOutStatus === 'Out of Range' ? 'out-of-range' :
                    record.ClockOutStatus === 'Early' ? 'early' : undefined
                  }>
                    <Typography variant="body2" fontFamily="monospace">
                      {formatTime(record.ActualClockOut)}
                    </Typography>
                  </HighlightedCell>
                  <TableCell>
                    <Typography variant="body2">
                      {record.ClockInController || record.ClockOutController || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {record.ClockInStatus && (
                        <StatusChip 
                          statustype={record.ClockInStatus.toLowerCase()}
                          label={`IN: ${record.ClockInStatus}`}
                          size="small"
                        />
                      )}
                      {record.ClockOutStatus && (
                        <StatusChip 
                          statustype={record.ClockOutStatus.toLowerCase()}
                          label={`OUT: ${record.ClockOutStatus}`}
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </Paper>
    );
  };

  return (
    <Box className={className}>
      {isMobile ? renderMobileCardView() : renderDesktopTableView()}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            size={isMobile ? "small" : "medium"}
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default EnhancedAttendanceTable;