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
import { Card } from "@/components/ui/card";
import { EnhancedAttendanceRecord } from "@/types/enhancedAttendance";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  // Display skeleton loader while loading
  if (isLoading) {
    if (isMobile) {
      return (
        <div className={className}>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-1/2 animate-pulse bg-gray-200 rounded"></div>
                  <div className="h-5 w-1/4 animate-pulse bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 w-1/3 animate-pulse bg-gray-200 rounded"></div>
                <div className="border-t my-2"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="h-4 w-full animate-pulse bg-gray-200 rounded mb-1"></div>
                    <div className="h-5 w-2/3 animate-pulse bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 w-full animate-pulse bg-gray-200 rounded mb-1"></div>
                    <div className="h-5 w-2/3 animate-pulse bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-4 w-1/3 animate-pulse bg-gray-200 rounded mb-1"></div>
                  <div className="h-5 w-1/2 animate-pulse bg-gray-200 rounded"></div>
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="h-6 w-1/4 animate-pulse bg-gray-200 rounded"></div>
                  <div className="h-6 w-1/4 animate-pulse bg-gray-200 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>C IN (Schedule)</TableHead>
              <TableHead>C Out (Schedule)</TableHead>
              <TableHead>Actual C In</TableHead>
              <TableHead>Actual C Out</TableHead>
              <TableHead>Controller</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 11 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 11 }).map((_, j) => (
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
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-md text-center",
        isMobile ? "bg-white shadow" : "border",
        className
      )}>
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
      case "Out of Range":
        return "bg-red-600 text-white border-red-700 font-bold animate-pulse";
      case "Missing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Updated schedule type badge color and display
  const getScheduleTypeBadge = (type: string | null | undefined) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;
    
    switch (type) {
      case "Fixed":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Fixed 7-17</Badge>;
      case "TwoShift_Day":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">2-Shift Day</Badge>;
      case "TwoShift_Night":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">2-Shift Night</Badge>;
      case "ThreeShift_Morning":
        return <Badge className="bg-green-100 text-green-800 border-green-200">3-Shift Morning</Badge>;
      case "ThreeShift_Afternoon":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">3-Shift Afternoon</Badge>;
      case "ThreeShift_Night":
        return <Badge className="bg-red-100 text-red-800 border-red-200">3-Shift Night</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Mobile card view
  if (isMobile) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {data.map((record, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                {/* Header with name and schedule type */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-base">{record.Name || "N/A"}</h3>
                    <p className="text-sm text-gray-500">{record.Department || "N/A"}</p>
                  </div>
                  <div>
                    {getScheduleTypeBadge(record.ScheduleType)}
                  </div>
                </div>
                
                {/* Date */}
                <div className="mb-3">
                  <p className="text-sm font-medium">{formatDate(record.Date)}</p>
                </div>
                
                <div className="border-t my-3"></div>
                
                {/* Schedule times */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Scheduled In</p>
                    <p className="font-medium">{formatTime(record.ScheduledClockIn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Scheduled Out</p>
                    <p className="font-medium">{formatTime(record.ScheduledClockOut)}</p>
                  </div>
                </div>
                
                {/* Actual times */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className={cn(record.ClockInStatus === 'Late' ? 'p-1 rounded bg-red-50' : '')}>
                    <p className="text-xs text-gray-500">Actual In</p>
                    <p className="font-medium">{formatTime(record.ActualClockIn)}</p>
                  </div>
                  <div className={cn(record.ClockOutStatus === 'Early' ? 'p-1 rounded bg-yellow-50' : '')}>
                    <p className="text-xs text-gray-500">Actual Out</p>
                    <p className="font-medium">{formatTime(record.ActualClockOut)}</p>
                  </div>
                </div>
                
                {/* Controller */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500">Controller</p>
                  <p className="text-sm">{record.ClockInController || record.ClockOutController || "N/A"}</p>
                </div>
                
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
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
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Desktop table view
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
        <Pagination className={cn("mt-4", isMobile && "pb-6")}>
          <PaginationContent className={cn(isMobile && "flex-wrap justify-center")}>
            <PaginationItem>
              <PaginationPrevious
                className={cn(
                  currentPage === 1 && "pointer-events-none opacity-50",
                  isMobile && "h-10 w-10 p-0 flex items-center justify-center"
                )}
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              />
            </PaginationItem>
            
            {/* Pagination rendering logic - simplified for mobile */}
            {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }).map((_, i) => {
              let pageNumber: number;
              
              if (totalPages <= (isMobile ? 3 : 5)) {
                pageNumber = i + 1;
              } else if (currentPage <= (isMobile ? 2 : 3)) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - (isMobile ? 1 : 2)) {
                pageNumber = totalPages - (isMobile ? 2 : 4) + i;
              } else {
                pageNumber = currentPage - (isMobile ? 1 : 2) + i;
              }
              
              if (pageNumber === 1 || pageNumber === totalPages || 
                (pageNumber >= currentPage - (isMobile ? 0 : 1) && pageNumber <= currentPage + (isMobile ? 0 : 1))) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === currentPage}
                      onClick={() => onPageChange(pageNumber)}
                      className={cn(isMobile && "h-10 w-10 p-0 flex items-center justify-center")}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (pageNumber === currentPage - (isMobile ? 1 : 2) || pageNumber === currentPage + (isMobile ? 1 : 2)) {
                return (
                  <PaginationItem key={`ellipsis-${pageNumber}`}>
                    <PaginationEllipsis className={cn(isMobile && "h-10 w-10 p-0 flex items-center justify-center")} />
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext
                className={cn(
                  currentPage === totalPages && "pointer-events-none opacity-50",
                  isMobile && "h-10 w-10 p-0 flex items-center justify-center"
                )}
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
