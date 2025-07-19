import React from "react";
import { toast } from "sonner";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import PageHeader from "@/components/PageHeader";
import MuiEnhancedAttendanceTable from "@/components/MuiEnhancedAttendanceTable";
import { 
  useEnhancedAttendanceFilters, 
  useEnhancedAttendanceData, 
  useEnhancedAttendanceExport 
} from "@/hooks/useEnhancedAttendance";
import { SCHEDULE_TYPE_OPTIONS, STATUS_OPTIONS, PAGE_SIZE_OPTIONS } from "@/constants/attendance";

// Styled components
const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
}));

const FilterCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
}));



const ExportButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 2),
}));

const PageSizeSelect = styled(Select)(({ theme }) => ({
  minWidth: 120,
  '& .MuiSelect-select': {
    padding: theme.spacing(1, 1.5),
  },
}));

const MuiEnhancedAttendance: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Use custom hooks
  const { filters, setFilters, buildApiFilters, buildExportParams } = useEnhancedAttendanceFilters();
  const { data: attendanceData, isLoading, error, refetch } = useEnhancedAttendanceData(buildApiFilters);
  const { exportState, handleExport } = useEnhancedAttendanceExport();

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
  };

  // Export handlers using custom hook
  const handleExportClick = async (format: "csv" | "pdf" | "xlsx") => {
    const exportParams = buildExportParams();
    await handleExport(format, exportParams);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StyledContainer maxWidth="xl">
        {/* Header */}
        <PageHeader
          title="Enhanced Attendance Report"
          subtitle="Comprehensive attendance tracking with schedule analysis and status monitoring"
          currentPage="enhanced-attendance"
        />

        {/* Filters */}
        <FilterCard>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="h6" fontWeight={600}>
                Filters
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {/* Date Range */}
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => date && setFilters(prev => ({ ...prev, startDate: date }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => date && setFilters(prev => ({ ...prev, endDate: date }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </Grid>

              {/* Search */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Search by name..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Department */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Department"
                  placeholder="Enter department..."
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                />
              </Grid>

              {/* Schedule Type */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Schedule Type</InputLabel>
                  <Select
                    value={filters.scheduleType}
                    label="Schedule Type"
                    onChange={(e) => setFilters(prev => ({ ...prev, scheduleType: e.target.value as any }))}
                  >
                    {SCHEDULE_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Clock In Status */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Clock In Status</InputLabel>
                  <Select
                    value={filters.clockInStatus}
                    label="Clock In Status"
                    onChange={(e) => setFilters(prev => ({ ...prev, clockInStatus: e.target.value as any }))}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Clock Out Status */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Clock Out Status</InputLabel>
                  <Select
                    value={filters.clockOutStatus}
                    label="Clock Out Status"
                    onChange={(e) => setFilters(prev => ({ ...prev, clockOutStatus: e.target.value as any }))}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </FilterCard>

        {/* Results Section */}
        <Card>
          <CardContent>
            {/* Results Header */}
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems={isMobile ? "flex-start" : "center"}
              flexDirection={isMobile ? "column" : "row"}
              gap={2}
              mb={3}
            >
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Attendance Records
                </Typography>
                {attendanceData && (
                  <Typography variant="body2" color="text.secondary">
                    Showing {attendanceData.data.length} of {attendanceData.total} records
                  </Typography>
                )}
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                {/* Export Buttons */}
                <ExportButton
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => handleExportClick("csv")}
                  disabled={exportState.isExporting || !attendanceData?.total}
                  size="small"
                  title={!attendanceData?.total ? "No data available for export" : "Export to CSV"}
                >
                  CSV
                </ExportButton>
                <ExportButton
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => handleExportClick("pdf")}
                  disabled={exportState.isExporting || !attendanceData?.total}
                  size="small"
                  title={!attendanceData?.total ? "No data available for export" : "Export to PDF"}
                >
                  PDF
                </ExportButton>
                <ExportButton
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => handleExportClick("xlsx")}
                  disabled={exportState.isExporting || !attendanceData?.total}
                  size="small"
                  title={!attendanceData?.total ? "No data available for export" : "Export to Excel"}
                >
                  XLSX
                </ExportButton>
                {!attendanceData?.total && (
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                    No data to export
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Page Size Selector */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <FormControl size="small">
                  <PageSizeSelect
                    value={filters.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <MenuItem key={size} value={size}>{size}</MenuItem>
                    ))}
                  </PageSizeSelect>
                </FormControl>
              </Box>

              {/* Active Filters */}
              {(filters.searchTerm || filters.department || filters.scheduleType || filters.clockInStatus || filters.clockOutStatus) && (
                <Box display="flex" gap={1} flexWrap="wrap">
                  {filters.searchTerm && (
                    <Chip 
                      label={`Search: ${filters.searchTerm}`} 
                      size="small" 
                      onDelete={() => setFilters(prev => ({ ...prev, searchTerm: "" }))}
                    />
                  )}
                  {filters.department && (
                    <Chip 
                      label={`Dept: ${filters.department}`} 
                      size="small" 
                      onDelete={() => setFilters(prev => ({ ...prev, department: "" }))}
                    />
                  )}
                  {filters.scheduleType && (
                    <Chip 
                      label={`Schedule: ${SCHEDULE_TYPE_OPTIONS.find(opt => opt.value === filters.scheduleType)?.label}`} 
                      size="small" 
                      onDelete={() => setFilters(prev => ({ ...prev, scheduleType: "" as any }))}
                    />
                  )}
                  {filters.clockInStatus && (
                    <Chip 
                      label={`Clock In: ${filters.clockInStatus}`} 
                      size="small" 
                      onDelete={() => setFilters(prev => ({ ...prev, clockInStatus: "" as any }))}
                    />
                  )}
                  {filters.clockOutStatus && (
                    <Chip 
                      label={`Clock Out: ${filters.clockOutStatus}`} 
                      size="small" 
                      onDelete={() => setFilters(prev => ({ ...prev, clockOutStatus: "" as any }))}
                    />
                  )}
                </Box>
              )}
            </Box>

            {/* Table */}
            <MuiEnhancedAttendanceTable
              data={attendanceData?.data || []}
              isLoading={isLoading}
              currentPage={filters.currentPage}
              totalPages={Math.ceil((attendanceData?.total || 0) / filters.pageSize)}
              onPageChange={(page) => setFilters(prev => ({ ...prev, currentPage: page }))}
            />
          </CardContent>
        </Card>
      </StyledContainer>
    </LocalizationProvider>
  );
};

export default MuiEnhancedAttendance;