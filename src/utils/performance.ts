import { useCallback, useMemo } from 'react';
import { debounce } from 'lodash-es';

// Debounced search hook
export const useDebouncedSearch = (callback: (value: string) => void, delay: number = 300) => {
  return useCallback(
    debounce((value: string) => {
      callback(value);
    }, delay),
    [callback, delay]
  );
};

// Memoized filter options
export const useFilterOptions = () => {
  return useMemo(() => ({
    scheduleTypes: [
      { value: "", label: "All Schedule Types" },
      { value: "Fixed", label: "Fixed 7-17" },
      { value: "TwoShift_Day", label: "2-Shift Day" },
      { value: "TwoShift_Night", label: "2-Shift Night" },
      { value: "ThreeShift_Morning", label: "3-Shift Morning" },
      { value: "ThreeShift_Afternoon", label: "3-Shift Afternoon" },
      { value: "ThreeShift_Night", label: "3-Shift Night" },
    ],
    statuses: [
      { value: "", label: "All Statuses" },
      { value: "Early", label: "Early" },
      { value: "OnTime", label: "On Time" },
      { value: "Late", label: "Late" },
      { value: "Missing", label: "Missing" },
    ],
    pageSizes: [10, 25, 50, 100],
  }), []);
};

// Format utilities
export const formatters = {
  date: (date: string | Date) => {
    if (!date) return "N/A";
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  },
  
  time: (time: string | null) => {
    if (!time) return "N/A";
    try {
      const date = new Date(`1970-01-01T${time}`);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  },
  
  filename: (prefix: string, startDate: string, endDate: string, extension: string) => {
    return `${prefix}-${startDate}-to-${endDate}.${extension}`;
  },
};