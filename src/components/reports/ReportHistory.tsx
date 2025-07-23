import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getReportHistory } from '../../api/reportApi';
import { ReportHistoryItem, ReportHistoryResponse } from '../../types/report';
import { format } from 'date-fns';

const ReportHistory: React.FC = () => {
  // State management
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load report history
  const loadReportHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page + 1, // API expects 1-based pagination
        limit: rowsPerPage,
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0],
        status: statusFilter || undefined,
      };

      const response: ReportHistoryResponse = await getReportHistory(params);
      setReports(response.data.records);
      setTotalRecords(response.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadReportHistory();
  }, [page, rowsPerPage, startDate, endDate, statusFilter]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter clear
  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('');
    setSearchTerm('');
    setPage(0);
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'success';
      case 'Failed':
        return 'error';
      case 'Partial':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Filter reports based on search term
  const filteredReports = reports.filter(report =>
    searchTerm === '' ||
    report.ReportType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.CreatedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.ErrorMessage && report.ErrorMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Report Generation History
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Success">Success</MenuItem>
                    <MenuItem value="Failed">Failed</MenuItem>
                    <MenuItem value="Partial">Partial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by type, user, or error..."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={1}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh">
                    <IconButton onClick={loadReportHistory} disabled={loading}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear Filters">
                    <IconButton onClick={handleClearFilters}>
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Report History Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Report History ({totalRecords} total)
              </Typography>
              {loading && <CircularProgress size={24} />}
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Report Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>WhatsApp</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.Id} hover>
                      <TableCell>{report.Id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {report.ReportType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.Status}
                          color={getStatusColor(report.Status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{report.CreatedBy}</TableCell>
                      <TableCell>
                        {format(new Date(report.CreatedAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={report.WhatsAppSent ? 'Sent' : 'Not Sent'}
                            color={report.WhatsAppSent ? 'success' : 'default'}
                            size="small"
                          />
                          {report.WhatsAppChatId && (
                            <Typography variant="caption" color="text.secondary">
                              {report.WhatsAppChatId}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReports.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No report history found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalRecords}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportHistory;