import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton
} from "@mui/material";
import { fetchEnhancedAttendanceFilterOptions } from "@/api/enhancedAttendanceFiltersApi";

interface DepartmentDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

export const DepartmentDropdown: React.FC<DepartmentDropdownProps> = ({
  value,
  onChange,
  label = "Department",
  disabled = false,
  className,
  includeAllOption = true,
  allOptionLabel = "All Departments",
  size = "small",
  fullWidth = true
}) => {
  // Fetch filter options
  const { 
    data: filterOptions, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["enhanced-attendance-filter-options"],
    queryFn: fetchEnhancedAttendanceFilterOptions,
    staleTime: 300000, // 5 minutes
    retry: 2
  });

  if (isLoading) {
    return <Skeleton variant="rectangular" height={40} className={className} />;
  }

  if (error) {
    return (
      <FormControl fullWidth={fullWidth} size={size} className={className}>
        <InputLabel>{label}</InputLabel>
        <Select
          value=""
          label={label}
          disabled
        >
          <MenuItem value="">Error loading departments</MenuItem>
        </Select>
      </FormControl>
    );
  }

  const departments = filterOptions?.departments || [];

  return (
    <FormControl fullWidth={fullWidth} size={size} className={className}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {includeAllOption && (
          <MenuItem value="">
            {allOptionLabel}
          </MenuItem>
        )}
        {departments
          .filter(department => department != null && department.value !== '' && department.value !== 'all')
          .map((department, index) => (
            <MenuItem key={`${department.value}-${index}`} value={department.value}>
              {department.label}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
};

export default DepartmentDropdown;