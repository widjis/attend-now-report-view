
import React from "react";
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
import { Badge } from "@/components/ui/badge";
import { EnhancedAttendanceRecord } from "@/types/enhancedAttendance";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EnhancedAttendanceTableProps {
  data: EnhancedAttendanceRecord[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const EnhancedAttendanceTable: React.FC<EnhancedAttendanceTableProps> = ({
  data,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  // Display skeleton loader while loading
  if (isLoading) {
    return (
      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>C IN (Schedule)</TableHead>
              <TableHead>C Out (Schedule)</TableHead>
              <TableHead>Actual C In</TableHead>
              <TableHead>Actual C Out</TableHead>
              <TableHead>Controller</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 10 }).map((_, j) => (
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
          Try adjusting your date range or search criteria
        </p>
      </div>
    );
  }

  // Format time
  const formatTime = (timeString: string | null): string => {
    if (!timeString) return "N/A";
    // Assume timeString is in ISO format or 'YYYY-MM-DD HH:mm:ss', extract time part
    // Try to extract HH:mm from the string
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

  // Get status badge color
  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "Early":
        return "bg-green-100 text-green-800";
      case "OnTime":
        return "bg-blue-100 text-blue-800";
      case "Late":
        return "bg-red-100 text-red-800";
      case "Missing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get schedule type badge color
  const getScheduleTypeBadge = (type: string | null | undefined) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;
    
    switch (type) {
      case "Fixed":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Fixed 7-17</Badge>;
      case "Shift1":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Shift 1</Badge>;
      case "Shift2":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Shift 2</Badge>;
      case "Shift3":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Shift 3</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className={className}>
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>C IN (Schedule)</TableHead>
              <TableHead>C OUT (Schedule)</TableHead>
              <TableHead>Actual C IN</TableHead>
              <TableHead>Actual C OUT</TableHead>
              <TableHead>Controller</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium">{record.Name || "N/A"}</TableCell>
                <TableCell>{record.Department || "N/A"}</TableCell>
                <TableCell>{record.Position || "N/A"}</TableCell>
                <TableCell>{formatDate(record.Date)}</TableCell>
                <TableCell>{getScheduleTypeBadge(record.ScheduleType)}</TableCell>
                <TableCell>{formatTime(record.ScheduledClockIn)}</TableCell>
                <TableCell>{formatTime(record.ScheduledClockOut)}</TableCell>
                <TableCell 
                  className={record.ClockInStatus === 'Late' ? 'bg-red-50' : ''}
                >
                  {formatTime(record.ActualClockIn)}
                </TableCell>
                <TableCell 
                  className={record.ClockOutStatus === 'Early' ? 'bg-yellow-50' : ''}
                >
                  {formatTime(record.ActualClockOut)}
                </TableCell>
                <TableCell>
                  {record.ClockInController || record.ClockOutController || "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {record.ClockInStatus && (
                      <Badge className={cn("text-xs", getStatusBadgeColor(record.ClockInStatus))}>
                        IN: {record.ClockInStatus}
                      </Badge>
                    )}
                    {record.ClockOutStatus && (
                      <Badge className={cn("text-xs", getStatusBadgeColor(record.ClockOutStatus))}>
                        OUT: {record.ClockOutStatus}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              />
            </PaginationItem>
            
            {/* Pagination rendering logic */}
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
      )}
    </div>
  );
};

export default EnhancedAttendanceTable;
