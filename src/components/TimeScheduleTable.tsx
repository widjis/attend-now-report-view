
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
import { TimeSchedule } from "../types/schedule";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TimeScheduleTableProps {
  data: TimeSchedule[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const TimeScheduleTable: React.FC<TimeScheduleTableProps> = ({
  data,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof TimeSchedule | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: keyof TimeSchedule) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const formatClockTime = (timeString: string | null): string => {
    if (!timeString) return "N/A";
    
    try {
      // Parse the time string and format it to HH:MM format
      const date = new Date(timeString);
      return format(date, "HH:mm");
    } catch (error) {
      console.error(`Error formatting time: ${timeString}`, error);
      return timeString || "N/A"; // Return original string if parsing fails
    }
  };

  // Display skeleton loader while loading
  if (isLoading) {
    return (
      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
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
        <h3 className="text-lg font-medium">No schedule records found</h3>
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

  const getSortIndicator = (column: keyof TimeSchedule) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className={className}>
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("StaffNo")}
              >
                Employee ID {getSortIndicator("StaffNo")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("Name")}
              >
                Name {getSortIndicator("Name")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("Email")}
              >
                Email {getSortIndicator("Email")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("TimeIn")}
              >
                Time In {getSortIndicator("TimeIn")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort("TimeOut")}
              >
                Time Out {getSortIndicator("TimeOut")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((record, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium">{record.StaffNo || "N/A"}</TableCell>
                <TableCell>{record.Name || "N/A"}</TableCell>
                <TableCell>{record.Email || "N/A"}</TableCell>
                <TableCell className={!record.TimeIn ? "bg-[#FEF7CD]" : ""}>
                  {formatClockTime(record.TimeIn)}
                </TableCell>
                <TableCell className={!record.TimeOut ? "bg-[#FEF7CD]" : ""}>
                  {formatClockTime(record.TimeOut)}
                </TableCell>
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

export default TimeScheduleTable;
