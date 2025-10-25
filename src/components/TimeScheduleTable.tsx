
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Pagination,
  Chip,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  TableSortLabel,
  useTheme,
  useMediaQuery,
  Paper,
  TableContainer,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { MTIUser } from "../types/schedule";

interface TimeScheduleTableProps {
  data: MTIUser[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[1],
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  backgroundColor: theme.palette.grey[50],
}));

const MobileCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[1],
}));

const TimeScheduleTable: React.FC<TimeScheduleTableProps> = ({
  data,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sortColumn, setSortColumn] = useState<keyof MTIUser | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: keyof MTIUser) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const formatClockTime = (timeString: string | null): string => {
    if (!timeString) return "N/A";
    return timeString;
  };

  const getDayTypeBadgeColor = (dayType: string | undefined): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (dayType?.toLowerCase()) {
      case 'weekday':
        return 'default';
      case 'weekend':
        return 'secondary';
      case 'holiday':
        return 'error';
      default:
        return 'default';
    }
  };

  // Display skeleton loader while loading
  if (isLoading) {
    if (isMobile) {
      return (
        <Box className={className}>
          {Array.from({ length: 5 }).map((_, i) => (
            <MobileCard key={i}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="50%" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="25%" />
                </Box>
                <Skeleton variant="rectangular" width="25%" height={24} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Time In</Typography>
                    <Skeleton variant="text" width={60} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Time Out</Typography>
                    <Skeleton variant="text" width={60} />
                  </Box>
                </Box>
              </CardContent>
            </MobileCard>
          ))}
        </Box>
      );
    }
    
    return (
      <StyledTableContainer className={className}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Employee ID</StyledTableCell>
              <StyledTableCell>Name</StyledTableCell>
              <StyledTableCell>Department</StyledTableCell>
              <StyledTableCell>Division</StyledTableCell>
              <StyledTableCell>Section</StyledTableCell>
              <StyledTableCell>Day Type</StyledTableCell>
              <StyledTableCell>Time In</StyledTableCell>
              <StyledTableCell>Time Out</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
    );
  }

  // Display empty state
  if (data.length === 0) {
    return (
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className={className}
      >
        <Typography variant="h6" gutterBottom>
          No schedule records found
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Try adjusting your filters or search criteria
        </Typography>
      </Paper>
    );
  }

  // Sort data if a sort column is selected
  const sortedData = [...data];
  if (sortColumn) {
    sortedData.sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      
      if (valA === null && valB === null) return 0;
      if (valA === null) return sortDirection === "asc" ? -1 : 1;
      if (valB === null) return sortDirection === "asc" ? 1 : -1;
      
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      
      if (sortDirection === "asc") {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });
  }

  // Render mobile card view
  const renderMobileCardView = () => {
    return (
      <Box className={className}>
        {sortedData.map((record, index) => (
          <MobileCard key={record.employee_id || index}>
            <CardContent>
              {/* Employee ID and Name */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Employee ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {record.employee_id || record.StaffNo || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="textSecondary">Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {record.employee_name || record.Name || "N/A"}
                  </Typography>
                  {record.position_title && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      {record.position_title}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Department, Division, Section */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Department</Typography>
                  <Typography variant="body2" noWrap>{record.department || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Division</Typography>
                  <Typography variant="body2" noWrap>{record.division || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Section</Typography>
                  <Typography variant="body2" noWrap>{record.section || "N/A"}</Typography>
                </Box>
              </Box>
              
              {/* Day Type */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>Day Type</Typography>
                {record.day_type ? (
                  <Chip 
                    label={record.day_type}
                    color={getDayTypeBadgeColor(record.day_type)}
                    size="small"
                  />
                ) : (
                  "N/A"
                )}
              </Box>
              
              {/* Time In and Time Out */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={!record.time_in ? { backgroundColor: '#FEF7CD', p: 2, borderRadius: 1 } : {}}>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>Time In</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2">{formatClockTime(record.time_in)}</Typography>
                    {record.next_day && record.time_in && (
                      <Chip 
                        label="Next Day"
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.75rem', mt: 0.5, width: 'fit-content' }}
                      />
                    )}
                  </Box>
                </Box>
                <Box sx={!record.time_out ? { backgroundColor: '#FEF7CD', p: 2, borderRadius: 1 } : {}}>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>Time Out</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2">{formatClockTime(record.time_out)}</Typography>
                    {record.next_day && record.time_out && (
                      <Chip 
                        label="Next Day"
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.75rem', mt: 0.5, width: 'fit-content' }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </MobileCard>
        ))}
      </Box>
    );
  };

  const getSortIndicator = (column: keyof MTIUser) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  // Render desktop table view
  const renderDesktopTableView = () => {
    return (
      <StyledTableContainer className={className}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>
                <TableSortLabel
                  active={sortColumn === "employee_id"}
                  direction={sortColumn === "employee_id" ? sortDirection : "asc"}
                  onClick={() => handleSort("employee_id")}
                >
                  Employee ID
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={sortColumn === "employee_name"}
                  direction={sortColumn === "employee_name" ? sortDirection : "asc"}
                  onClick={() => handleSort("employee_name")}
                >
                  Name
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={sortColumn === "department"}
                  direction={sortColumn === "department" ? sortDirection : "asc"}
                  onClick={() => handleSort("department")}
                >
                  Department
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={sortColumn === "division"}
                  direction={sortColumn === "division" ? sortDirection : "asc"}
                  onClick={() => handleSort("division")}
                >
                  Division
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={sortColumn === "section"}
                  direction={sortColumn === "section" ? sortDirection : "asc"}
                  onClick={() => handleSort("section")}
                >
                  Section
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={sortColumn === "day_type"}
                  direction={sortColumn === "day_type" ? sortDirection : "asc"}
                  onClick={() => handleSort("day_type")}
                >
                  Day Type
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={sortColumn === "time_in"}
                  direction={sortColumn === "time_in" ? sortDirection : "asc"}
                  onClick={() => handleSort("time_in")}
                >
                  Time In
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={sortColumn === "time_out"}
                  direction={sortColumn === "time_out" ? sortDirection : "asc"}
                  onClick={() => handleSort("time_out")}
                >
                  Time Out
                </TableSortLabel>
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((record, index) => (
              <TableRow 
                key={record.employee_id || index} 
                sx={{ '&:hover': { backgroundColor: theme.palette.grey[50] } }}
              >
                <TableCell sx={{ fontWeight: 500 }}>
                  {record.employee_id || record.StaffNo || "N/A"}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {record.employee_name || record.Name || "N/A"}
                    </Typography>
                    {record.position_title && (
                      <Typography variant="caption" color="textSecondary">
                        {record.position_title}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{record.department || "N/A"}</TableCell>
                <TableCell>{record.division || "N/A"}</TableCell>
                <TableCell>{record.section || "N/A"}</TableCell>
                <TableCell>
                  {record.day_type ? (
                    <Chip 
                      label={record.day_type}
                      color={getDayTypeBadgeColor(record.day_type)}
                      size="small"
                    />
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell sx={!record.time_in ? { backgroundColor: '#FEF7CD' } : {}}>
                  <Box>
                    <Typography variant="body2">{formatClockTime(record.time_in)}</Typography>
                    {record.next_day && record.time_in && (
                      <Chip 
                        label="Next Day"
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.75rem', mt: 0.5 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={!record.time_out ? { backgroundColor: '#FEF7CD' } : {}}>
                  <Box>
                    <Typography variant="body2">{formatClockTime(record.time_out)}</Typography>
                    {record.next_day && record.time_out && (
                      <Chip 
                        label="Next Day"
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.75rem', mt: 0.5 }}
                      />
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
    );
  };

  return (
    <>
      {isMobile ? renderMobileCardView() : renderDesktopTableView()}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pb: isMobile ? 6 : 0 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, page) => onPageChange(page)}
            color="primary"
            size={isMobile ? "small" : "medium"}
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
};

export default TimeScheduleTable;
