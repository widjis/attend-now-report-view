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

interface CardTypeDropdownProps {
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

const CardTypeDropdown: React.FC<CardTypeDropdownProps> = ({
  value,
  onChange,
  label = "Card Type",
  disabled = false,
  className,
  includeAllOption = true,
  allOptionLabel = "All Card Types",
  size = "small",
  fullWidth = true,
}) => {
  const { data: filterOptions, isLoading, error } = useQuery({
    queryKey: ["enhancedAttendanceFilterOptions"],
    queryFn: fetchEnhancedAttendanceFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Skeleton 
        variant="rectangular" 
        height={size === "small" ? 40 : 56} 
        sx={{ borderRadius: 1 }}
      />
    );
  }

  if (error) {
    console.error("Error loading card type filter options:", error);
  }

  const cardTypes = filterOptions?.cardTypes || [];

  return (
    <FormControl 
      fullWidth={fullWidth} 
      size={size} 
      disabled={disabled}
      className={className}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {includeAllOption && (
          <MenuItem value="">
            {allOptionLabel}
          </MenuItem>
        )}
        {cardTypes
          .filter(cardType => cardType != null && cardType.value !== '' && cardType.value !== 'all')
          .map((cardType, index) => (
            <MenuItem key={`${cardType.value}-${index}`} value={cardType.value}>
              {cardType.label}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
};

export default CardTypeDropdown;