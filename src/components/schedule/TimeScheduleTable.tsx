import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton,
  Skeleton,
  Pagination,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { MTIUser } from '@/types/schedule';
import { Info as InfoIcon } from '@mui/icons-material';

interface TimeScheduleTableProps {
  data: MTIUser[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TimeScheduleTable: React.FC<TimeScheduleTableProps> = ({
  data,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Format time string for display
  const formatTime = (time: string | null | undefined) => {
    if (!time) return '—';
    
    // If time is already in HH:MM format, return it
    if (/^\d{1,2}:\d{2}$/.test(time)) return time;
    
    try {
      // Try to parse as date if it's a date string
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      // If parsing fails, return the original string
    }
    
    return time;
  };

  // Handle page change
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Box>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee ID</TableCell>
                <TableCell>Name</TableCell>
                {!isMobile && (
                  <>
                    <TableCell>Department</TableCell>
                    <TableCell>Section</TableCell>
                  </>
                )}
                <TableCell>Time In</TableCell>
                <TableCell>Time Out</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(10)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={150} /></TableCell>
                  {!isMobile && (
                    <>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                    </>
                  )}
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="center" mt={2}>
          <Skeleton width={300} height={40} />
        </Box>
      </Box>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No schedule data found. Try adjusting your filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              {!isMobile && (
                <>
                  <TableCell>Department</TableCell>
                  <TableCell>Section</TableCell>
                </>
              )}
              <TableCell>Time In</TableCell>
              <TableCell>Time Out</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((employee) => (
              <TableRow key={employee.employee_id || employee.StaffNo}>
                <TableCell>{employee.employee_id || employee.StaffNo}</TableCell>
                <TableCell>{employee.employee_name || employee.Name}</TableCell>
                {!isMobile && (
                  <>
                    <TableCell>{employee.department || '—'}</TableCell>
                    <TableCell>{employee.section || '—'}</TableCell>
                  </>
                )}
                <TableCell>
                  {formatTime(employee.time_in)}
                </TableCell>
                <TableCell>
                  {formatTime(employee.time_out)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination 
          count={totalPages} 
          page={currentPage} 
          onChange={handlePageChange} 
          color="primary" 
          showFirstButton 
          showLastButton
        />
      </Box>
    </Box>
  );
};

export default TimeScheduleTable;