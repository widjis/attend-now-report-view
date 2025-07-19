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

  return (
    <Box className={className}>
      <Paper>
        <StyledTableContainer>
          <Table stickyHeader>
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
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2">
                        {record.Position || "N/A"}
                      </Typography>
                    </TableCell>
                  )}
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
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2">
                        {record.ClockInController || record.ClockOutController || "N/A"}
                      </Typography>
                    </TableCell>
                  )}
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