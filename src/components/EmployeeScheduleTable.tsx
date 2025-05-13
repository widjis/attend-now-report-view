
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEmployeeSchedule } from "@/api/employeeApi";
import { EmployeeFilters } from "@/types/employee";
import { SearchBar } from "./SearchBar";
import { FilterDropdown } from "./FilterDropdown";
import { getFilterOptions } from "@/api/attendanceApi";
import { DateRangePicker } from "./DateRangePicker";
import { format } from "date-fns";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
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

import { Skeleton } from "@/components/ui/skeleton";

export const EmployeeScheduleTable = () => {
  // State for filters
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    pageSize: 10,
    search: "",
    department: "",
    company: "",
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["filterOptions"],
    queryFn: getFilterOptions,
  });

  // Fetch employee data
  const {
    data: employeeData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employeeSchedule", filters],
    queryFn: () => fetchEmployeeSchedule(filters),
  });

  // Handle search
  const handleSearch = (searchValue: string) => {
    setFilters((prev) => ({ ...prev, search: searchValue, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Generate pagination items
  const renderPagination = () => {
    if (!employeeData) return null;

    const { page, pageSize, total } = employeeData;
    const totalPages = Math.ceil(total / pageSize);

    if (totalPages <= 1) return null;

    const items = [];
    const maxVisiblePages = 5;
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => handlePageChange(page - 1)}
          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );

    // Calculate which page numbers to show
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === page}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => handlePageChange(page + 1)}
          className={
            page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
          }
        />
      </PaginationItem>
    );

    return <PaginationContent>{items}</PaginationContent>;
  };

  const renderTable = () => {
    if (isLoading) {
      return Array.from({ length: filters.pageSize }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 7 }).map((_, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            <div className="flex flex-col items-center justify-center text-destructive">
              <p className="text-lg font-medium">Error loading data</p>
              <p className="text-sm">
                {error instanceof Error ? error.message : "Unknown error occurred"}
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (!employeeData || employeeData.data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            No employee schedule records found.
          </TableCell>
        </TableRow>
      );
    }

    return employeeData.data.map((employee, index) => (
      <TableRow key={index}>
        <TableCell className="font-medium">{employee.staffNo}</TableCell>
        <TableCell>{employee.name}</TableCell>
        <TableCell>{employee.position}</TableCell>
        <TableCell>{employee.department}</TableCell>
        <TableCell>{employee.company}</TableCell>
        <TableCell>{employee.timeIn}</TableCell>
        <TableCell>{employee.timeOut}</TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchBar
          value={filters.search || ""}
          onChange={handleSearch}
          placeholder="Search by name, department, or staff ID..."
        />

        <div className="flex flex-col gap-2 md:flex-row">
          <FilterDropdown
            label="Department"
            value={filters.department || ""}
            onChange={(value) => handleFilterChange("department", value)}
            options={filterOptions?.departments || []}
          />
          <FilterDropdown
            label="Company"
            value={filters.company || ""}
            onChange={(value) => handleFilterChange("company", value)}
            options={filterOptions?.companies || []}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTable()}</TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end py-4">
        <Pagination className="mx-auto md:ml-0">
          {renderPagination()}
        </Pagination>
        <div className="hidden text-sm text-muted-foreground md:block">
          {employeeData
            ? `Showing ${filters.page === 1 ? 1 : (filters.page - 1) * filters.pageSize + 1
            } to ${Math.min(
              filters.page * filters.pageSize,
              employeeData.total
            )} of ${employeeData.total} records`
            : "Loading..."}
        </div>
      </div>
    </div>
  );
};
