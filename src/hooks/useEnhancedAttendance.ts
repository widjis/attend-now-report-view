import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import { toast } from "sonner";

import { fetchEnhancedAttendanceData, exportEnhancedAttendanceCsv, exportEnhancedAttendancePdf, exportEnhancedAttendanceXlsx } from "@/api/enhancedAttendanceApi";
import { EnhancedAttendanceFilters } from "@/types/enhancedAttendance";
import { FilterState, ExportState, ExportFormat, ScheduleTypeOption, StatusOption } from "@/types/ui";
import { DEFAULT_PAGE_SIZE, DEFAULT_DATE_RANGE_DAYS, STALE_TIME_MS, EXPORT_FILENAME_PREFIX } from "@/constants/attendance";

export const useEnhancedAttendanceFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: dayjs().subtract(DEFAULT_DATE_RANGE_DAYS, 'day'),
    endDate: dayjs(),
    searchTerm: "",
    department: "",
    scheduleType: "" as ScheduleTypeOption,
    clockInStatus: "" as StatusOption,
    clockOutStatus: "" as StatusOption,
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Reset page when filters change
  useEffect(() => {
    setFilters(prev => ({ ...prev, currentPage: 1 }));
  }, [
    filters.startDate,
    filters.endDate,
    filters.searchTerm,
    filters.department,
    filters.scheduleType,
    filters.clockInStatus,
    filters.clockOutStatus,
    filters.pageSize
  ]);

  const buildApiFilters = (): EnhancedAttendanceFilters => ({
    startDate: filters.startDate.format("YYYY-MM-DD"),
    endDate: filters.endDate.format("YYYY-MM-DD"),
    search: filters.searchTerm.trim() || undefined,
    department: filters.department || undefined,
    scheduleType: filters.scheduleType === "" ? undefined : filters.scheduleType as EnhancedAttendanceFilters['scheduleType'],
    clockInStatus: filters.clockInStatus === "" ? undefined : filters.clockInStatus as EnhancedAttendanceFilters['clockInStatus'],
    clockOutStatus: filters.clockOutStatus === "" ? undefined : filters.clockOutStatus as EnhancedAttendanceFilters['clockOutStatus'],
    page: filters.currentPage,
    pageSize: filters.pageSize,
  });

  // Convert filters to export format (exclude pagination for full export)
  const buildExportParams = (): Record<string, string | number | undefined> => {
    const apiFilters = buildApiFilters();
    return {
      startDate: apiFilters.startDate,
      endDate: apiFilters.endDate,
      search: apiFilters.search,
      department: apiFilters.department,
      scheduleType: apiFilters.scheduleType,
      clockInStatus: apiFilters.clockInStatus,
      clockOutStatus: apiFilters.clockOutStatus,
      // Exclude pagination for exports to get all data
    };
  };

  return {
    filters,
    setFilters,
    buildApiFilters,
    buildExportParams,
  };
};

export const useEnhancedAttendanceData = (buildApiFilters: () => EnhancedAttendanceFilters) => {
  return useQuery({
    queryKey: ["enhancedAttendance", buildApiFilters()],
    queryFn: () => fetchEnhancedAttendanceData(buildApiFilters()),
    staleTime: STALE_TIME_MS,
  });
};

export const useEnhancedAttendanceExport = () => {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
  });

  const handleExport = async (format: ExportFormat, exportParams: Record<string, string | number | undefined>) => {
    setExportState({ isExporting: true, format });
    
    try {
      console.log(`Starting ${format.toUpperCase()} export with params:`, exportParams);
      
      let blob: Blob;
      let filename: string;

      switch (format) {
        case "csv":
          blob = await exportEnhancedAttendanceCsv(exportParams);
          filename = `${EXPORT_FILENAME_PREFIX}-${exportParams.startDate}-to-${exportParams.endDate}.csv`;
          break;
        case "pdf":
          blob = await exportEnhancedAttendancePdf(exportParams);
          filename = `${EXPORT_FILENAME_PREFIX}-${exportParams.startDate}-to-${exportParams.endDate}.pdf`;
          break;
        case "xlsx":
          blob = await exportEnhancedAttendanceXlsx(exportParams);
          filename = `${EXPORT_FILENAME_PREFIX}-${exportParams.startDate}-to-${exportParams.endDate}.xlsx`;
          break;
      }

      // Check if the blob is empty or very small (likely just headers)
      if (blob.size < 1000) {
        console.warn(`Export blob size is very small (${blob.size} bytes), might contain no data`);
        toast.warning(`${format.toUpperCase()} export completed, but no data was found for the selected criteria. Please check your date range and filters.`);
      } else {
        console.log(`Export blob size: ${blob.size} bytes`);
        toast.success(`${format.toUpperCase()} export completed successfully!`);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      
      // Provide more specific error messages
      let errorMessage = `Failed to export ${format.toUpperCase()}. Please try again.`;
      
      if (error instanceof Error) {
        if (error.message.includes('No data found')) {
          errorMessage = `No data found for the selected date range and filters. Please adjust your criteria and try again.`;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = `Network error during export. Please check your connection and try again.`;
        } else if (error.message.includes('timeout')) {
          errorMessage = `Export timed out. Please try with a smaller date range.`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setExportState({ isExporting: false });
    }
  };

  return {
    exportState,
    handleExport,
  };
};