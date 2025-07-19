

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Box,
  Typography,
  Chip,
  Skeleton,
  TableSortLabel
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { AttendanceRecord } from "../types/attendance";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);


// Define timezone constant
const TIMEZONE = "UTC"; // Equivalent to GMT+0
const TIMEZONE_DISPLAY = "UTC+7";

interface AttendanceTableProps {
  data: AttendanceRecord[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}



const AttendanceTable: React.FC<AttendanceTableProps> = ({
  data,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof AttendanceRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: keyof AttendanceRecord) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "N/A";
    try {
      // Use dayjs to format the date in the specified timezone
      return dayjs(dateTime)
        .tz(TIMEZONE)
        .format("MMM DD, YYYY HH:mm");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateTime;
    }
  };

  // Display skeleton loader while loading
  if (isLoading) {
    return (
      <TableContainer component={Paper} className={className}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Card No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Clock Event</TableCell>
              <TableCell>Controller</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton variant="text" width="100%" height={20} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Display empty state
  if (data.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 4, 
          border: 1, 
          borderColor: 'divider', 
          borderRadius: 1, 
          textAlign: 'center' 
        }}
      >
        <Typography variant="h6" component="h3">
          No attendance records found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try adjusting your filters or search criteria
        </Typography>
      </Box>
    );
  }

  const sortedData = [...data];
  if (sortColumn) {
    sortedData.sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      
      // Handle null values
      if (valA === null && valB === null) return 0;
      if (valA === null) return sortDirection === "asc" ? -1 : 1;
      if (valB === null) return sortDirection === "asc" ? 1 : -1;
      
      // Compare based on data type
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      
      // Convert to string for comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      
      if (sortDirection === "asc") {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });
  }


  return (
    <Box className={className}>
      <TableContainer component={Paper}>
        <Box sx={{ bgcolor: 'grey.50', px: 2, py: 1, textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Times are displayed in {TIMEZONE_DISPLAY} (database native timezone)
          </Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === "CardNo"}
                  direction={sortColumn === "CardNo" ? sortDirection : "asc"}
                  onClick={() => handleSort("CardNo")}
                >
                  Card No
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === "Name"}
                  direction={sortColumn === "Name" ? sortDirection : "asc"}
                  onClick={() => handleSort("Name")}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === "Department"}
                  direction={sortColumn === "Department" ? sortDirection : "asc"}
                  onClick={() => handleSort("Department")}
                >
                  Department
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === "Position"}
                  direction={sortColumn === "Position" ? sortDirection : "asc"}
                  onClick={() => handleSort("Position")}
                >
                  Position
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === "TrDateTime"}
                  direction={sortColumn === "TrDateTime" ? sortDirection : "asc"}
                  onClick={() => handleSort("TrDateTime")}
                >
                  Date & Time ({TIMEZONE_DISPLAY})
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === "ClockEvent"}
                  direction={sortColumn === "ClockEvent" ? sortDirection : "asc"}
                  onClick={() => handleSort("ClockEvent")}
                >
                  Clock Event
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === "TrController"}
                  direction={sortColumn === "TrController" ? sortDirection : "asc"}
                  onClick={() => handleSort("TrController")}
                >
                  Controller
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((record, index) => (
              <TableRow key={index} hover>
                <TableCell sx={{ fontWeight: 'medium' }}>{record.CardNo || "N/A"}</TableCell>
                <TableCell>{record.Name || "N/A"}</TableCell>
                <TableCell>{record.Department || "N/A"}</TableCell>
                <TableCell>{record.Position || "N/A"}</TableCell>
                <TableCell>{formatDateTime(record.TrDateTime)}</TableCell>
                <TableCell>
                  <Chip
                    label={record.ClockEvent || "N/A"}
                    color={record.ClockEvent === "Clock In" ? "success" : "warning"}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{record.TrController || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
};

export default AttendanceTable;
