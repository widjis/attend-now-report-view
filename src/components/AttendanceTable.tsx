
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format, parseISO } from "date-fns";
import { AttendanceRecord } from "../types/attendance";
import { cn } from "@/lib/utils";

interface AttendanceTableProps {
  data: AttendanceRecord[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const TIMEZONE_DISPLAY = "GMT+8";

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
      // The date is already in GMT+8, so just format it without timezone conversion
      // Just parse the ISO string and format it
      const parsedDate = parseISO(dateTime);
      return format(parsedDate, "MMM dd, yyyy HH:mm");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateTime;
    }
  };

  // Display skeleton loader while loading
  if (isLoading) {
    return (
      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Card No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Clock Event</TableHead>
              <TableHead>Controller</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 w-full animate-pulse bg-gray-200 rounded"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Display empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-md text-center">
        <h3 className="text-lg font-medium">No attendance records found</h3>
        <p className="text-sm text-gray-500 mt-2">
          Try adjusting your filters or search criteria
        </p>
      </div>
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

  const getSortIndicator = (column: keyof AttendanceRecord) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className={className}>
      <div className="rounded-md border overflow-x-auto">
        <div className="bg-gray-50 px-4 py-2 text-right text-sm text-gray-500">
          Times are displayed in {TIMEZONE_DISPLAY} (database native timezone)
        </div>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("CardNo")}
              >
                Card No{getSortIndicator("CardNo")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("Name")}
              >
                Name{getSortIndicator("Name")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("Department")}
              >
                Department{getSortIndicator("Department")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("Position")}
              >
                Position{getSortIndicator("Position")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("TrDateTime")}
              >
                Date & Time ({TIMEZONE_DISPLAY}){getSortIndicator("TrDateTime")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("ClockEvent")}
              >
                Clock Event{getSortIndicator("ClockEvent")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("TrController")}
              >
                Controller{getSortIndicator("TrController")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((record, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium">{record.CardNo || "N/A"}</TableCell>
                <TableCell>{record.Name || "N/A"}</TableCell>
                <TableCell>{record.Department || "N/A"}</TableCell>
                <TableCell>{record.Position || "N/A"}</TableCell>
                <TableCell>{formatDateTime(record.TrDateTime)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      record.ClockEvent === "Clock In"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    )}
                  >
                    {record.ClockEvent || "N/A"}
                  </span>
                </TableCell>
                <TableCell>{record.TrController || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            />
          </PaginationItem>
          
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNumber: number;
            
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }
            
            if (pageNumber === 1 || pageNumber === totalPages || 
               (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={pageNumber === currentPage}
                    onClick={() => onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
              return (
                <PaginationItem key={`ellipsis-${pageNumber}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          })}
          
          <PaginationItem>
            <PaginationNext
              className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default AttendanceTable;
