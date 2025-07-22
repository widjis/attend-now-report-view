
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MTIUser } from "../types/schedule";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface TimeScheduleTableProps {
  data: MTIUser[];
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
  const isMobile = useIsMobile();
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
    // Time is already formatted as HH:MM from the backend
    return timeString;
  };

  const getDayTypeBadgeColor = (dayType: string | undefined) => {
    switch (dayType?.toLowerCase()) {
      case 'weekday':
        return 'default';
      case 'weekend':
        return 'secondary';
      case 'holiday':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Display skeleton loader while loading
  if (isLoading) {
    if (isMobile) {
      // Mobile skeleton loader with cards
      return (
        <div className={className}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="mb-4 bg-white shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Employee ID and Name */}
                  <div className="flex justify-between">
                    <div className="w-1/3 h-4 animate-pulse bg-gray-200 rounded"></div>
                    <div className="w-1/2 h-4 animate-pulse bg-gray-200 rounded"></div>
                  </div>
                  
                  {/* Department, Division, Section */}
                  <div className="flex justify-between">
                    <div className="w-1/4 h-4 animate-pulse bg-gray-200 rounded"></div>
                    <div className="w-1/4 h-4 animate-pulse bg-gray-200 rounded"></div>
                    <div className="w-1/4 h-4 animate-pulse bg-gray-200 rounded"></div>
                  </div>
                  
                  {/* Day Type */}
                  <div className="w-1/4 h-6 animate-pulse bg-gray-200 rounded"></div>
                  
                  {/* Time In and Time Out */}
                  <div className="flex justify-between pt-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Time In</div>
                      <div className="w-16 h-4 animate-pulse bg-gray-200 rounded"></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Time Out</div>
                      <div className="w-16 h-4 animate-pulse bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    // Desktop skeleton loader with table
    return (
      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Day Type</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
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
        <h3 className="text-lg font-medium">No schedule records found</h3>
        <p className="text-sm text-gray-500 mt-2">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  // Sort data if a sort column is selected
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

  const getSortIndicator = (column: keyof MTIUser) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  // Render mobile card view
  const renderMobileCardView = () => {
    return (
      <div className={className}>
        {sortedData.map((record, index) => (
          <Card key={record.employee_id || index} className="mb-4 bg-white shadow">
            <CardContent className="p-4">
              {/* Employee ID and Name */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm text-gray-500">Employee ID</div>
                  <div className="font-medium">
                    {record.employee_id || record.StaffNo || "N/A"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium">
                    {record.employee_name || record.Name || "N/A"}
                  </div>
                  {record.position_title && (
                    <div className="text-xs text-gray-500">
                      {record.position_title}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Department, Division, Section */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Department</div>
                  <div className="text-sm truncate">{record.department || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Division</div>
                  <div className="text-sm truncate">{record.division || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Section</div>
                  <div className="text-sm truncate">{record.section || "N/A"}</div>
                </div>
              </div>
              
              {/* Day Type */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Day Type</div>
                {record.day_type ? (
                  <Badge variant={getDayTypeBadgeColor(record.day_type)}>
                    {record.day_type}
                  </Badge>
                ) : (
                  "N/A"
                )}
              </div>
              
              {/* Time In and Time Out */}
              <div className="flex justify-between pt-2 border-t">
                <div className={cn(!record.time_in ? "bg-[#FEF7CD] p-2 rounded" : "")}>
                  <div className="text-xs text-gray-500 mb-1">Time In</div>
                  <div className="flex flex-col">
                    <span>{formatClockTime(record.time_in)}</span>
                    {record.next_day && record.time_in && (
                      <Badge variant="outline" className="text-xs mt-1 w-fit">
                        Next Day
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={cn(!record.time_out ? "bg-[#FEF7CD] p-2 rounded" : "")}>
                  <div className="text-xs text-gray-500 mb-1">Time Out</div>
                  <div className="flex flex-col">
                    <span>{formatClockTime(record.time_out)}</span>
                    {record.next_day && record.time_out && (
                      <Badge variant="outline" className="text-xs mt-1 w-fit">
                        Next Day
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render desktop table view
  const renderDesktopTableView = () => {
    return (
      <div className={className}>
        <div className="rounded-md border overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("employee_id")}
                >
                  Employee ID {getSortIndicator("employee_id")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("employee_name")}
                >
                  Name {getSortIndicator("employee_name")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("department")}
                >
                  Department {getSortIndicator("department")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("division")}
                >
                  Division {getSortIndicator("division")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("section")}
                >
                  Section {getSortIndicator("section")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("day_type")}
                >
                  Day Type {getSortIndicator("day_type")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("time_in")}
                >
                  Time In {getSortIndicator("time_in")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("time_out")}
                >
                  Time Out {getSortIndicator("time_out")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((record, index) => (
                <TableRow key={record.employee_id || index} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {record.employee_id || record.StaffNo || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {record.employee_name || record.Name || "N/A"}
                      </span>
                      {record.position_title && (
                        <span className="text-xs text-gray-500">
                          {record.position_title}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{record.department || "N/A"}</TableCell>
                  <TableCell>{record.division || "N/A"}</TableCell>
                  <TableCell>{record.section || "N/A"}</TableCell>
                  <TableCell>
                    {record.day_type ? (
                      <Badge variant={getDayTypeBadgeColor(record.day_type)}>
                        {record.day_type}
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className={!record.time_in ? "bg-[#FEF7CD]" : ""}>
                    <div className="flex flex-col">
                      <span>{formatClockTime(record.time_in)}</span>
                      {record.next_day && record.time_in && (
                        <Badge variant="outline" className="text-xs mt-1 w-fit">
                          Next Day
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={!record.time_out ? "bg-[#FEF7CD]" : ""}>
                    <div className="flex flex-col">
                      <span>{formatClockTime(record.time_out)}</span>
                      {record.next_day && record.time_out && (
                        <Badge variant="outline" className="text-xs mt-1 w-fit">
                          Next Day
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <>
      {isMobile ? renderMobileCardView() : renderDesktopTableView()}

      {totalPages > 1 && (
        <Pagination className={cn("mt-4", isMobile && "pb-6")}>
          <PaginationContent className={cn(isMobile && "flex-wrap justify-center")}>
            <PaginationItem>
              <PaginationPrevious
                className={cn(
                  currentPage === 1 && "pointer-events-none opacity-50",
                  isMobile && "text-sm h-8 w-8 p-0"
                )}
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              />
            </PaginationItem>
            
            {/* Adjust pagination rendering for different page sizes */}
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
                      className={cn(isMobile && "text-sm h-8 w-8 p-0")}
                      isActive={pageNumber === currentPage}
                      onClick={() => onPageChange(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (pageNumber === currentPage - (isMobile ? 1 : 2) || pageNumber === currentPage + (isMobile ? 1 : 2)) {
                return (
                  <PaginationItem key={`ellipsis-${pageNumber}`}>
                    <PaginationEllipsis className={cn(isMobile && "h-8 w-8")} />
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext
                className={cn(
                  currentPage === totalPages && "pointer-events-none opacity-50",
                  isMobile && "text-sm h-8 w-8 p-0"
                )}
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};

export default TimeScheduleTable;
