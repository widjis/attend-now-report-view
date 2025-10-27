import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { syncAttendance, getSyncHistory, previewSyncData } from '@/api/syncApi';
import { SyncAttendanceParams, SyncResult, SyncHistoryItem } from '@/types/sync';

const SyncAttendance: React.FC = () => {
  const [params, setParams] = useState<SyncAttendanceParams>({
    startDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    endDateTime: new Date().toISOString(), // Now
    sendWhatsApp: false,
    whatsappChatId: '',
    dryRun: true,
    batchSize: 1000,
    tolerance: 30,
    insertToMCG: true,
    useManualTimes: false,
    manualInTime: '08:00',
    manualOutTime: '17:00',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadSyncHistory();
  }, []);

  const loadSyncHistory = async () => {
    try {
      const response = await getSyncHistory({ limit: 10 });
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load sync history:', error);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await syncAttendance(params);
      setResult(result);
      await loadSyncHistory(); // Refresh history
    } catch (error) {
      console.error('Sync failed:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
        data: {} as any
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const response = await previewSyncData({
        startDateTime: params.startDateTime,
        endDateTime: params.endDateTime,
        limit: 100
      });
      setPreviewData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'running': return 'warning';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sync Attendance
        </Typography>
        
        <Grid container spacing={3}>
          {/* Sync Parameters */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sync Parameters
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={new Date(params.startDateTime)}
                      onChange={(date) => date && setParams(prev => ({
                        ...prev,
                        startDateTime: date.toISOString()
                      }))}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={new Date(params.endDateTime)}
                      onChange={(date) => date && setParams(prev => ({
                        ...prev,
                        endDateTime: date.toISOString()
                      }))}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Batch Size"
                      type="number"
                      value={params.batchSize}
                      onChange={(e) => setParams(prev => ({
                        ...prev,
                        batchSize: parseInt(e.target.value) || 1000
                      }))}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Tolerance (minutes)"
                      type="number"
                      value={params.tolerance}
                      onChange={(e) => setParams(prev => ({
                        ...prev,
                        tolerance: parseInt(e.target.value) || 30
                      }))}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={params.dryRun}
                          onChange={(e) => setParams(prev => ({
                            ...prev,
                            dryRun: e.target.checked
                          }))}
                        />
                      }
                      label="Dry Run (Preview only, don't save data)"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={params.insertToMCG}
                          onChange={(e) => setParams(prev => ({
                            ...prev,
                            insertToMCG: e.target.checked
                          }))}
                        />
                      }
                      label="Insert to MCG Tables"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={params.useManualTimes}
                          onChange={(e) => setParams(prev => ({
                            ...prev,
                            useManualTimes: e.target.checked
                          }))}
                        />
                      }
                      label="Use Manual Times"
                    />
                  </Grid>
                  
                  {params.useManualTimes && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Manual In Time"
                          type="time"
                          value={params.manualInTime}
                          onChange={(e) => setParams(prev => ({
                            ...prev,
                            manualInTime: e.target.value
                          }))}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Manual Out Time"
                          type="time"
                          value={params.manualOutTime}
                          onChange={(e) => setParams(prev => ({
                            ...prev,
                            manualOutTime: e.target.value
                          }))}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreview}
                    disabled={loading}
                  >
                    Preview Data
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleSync}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Syncing...' : 'Start Sync'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Sync History */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Sync History
                </Typography>
                
                {history.length > 0 ? (
                  <Box>
                    {history.slice(0, 5).map((item) => (
                      <Box key={item.id} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={item.status}
                            color={getStatusColor(item.status) as any}
                            size="small"
                          />
                          <Typography variant="caption">
                            {formatDateTime(item.executedAt)}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          Processed: {item.recordsProcessed} | Inserted: {item.recordsInserted}
                        </Typography>
                      </Box>
                    ))}
                    
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setShowHistory(true)}
                    >
                      View All History
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No sync history available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Sync Result */}
          {result && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sync Result
                  </Typography>
                  
                  <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {result.message}
                  </Alert>
                  
                  {result.success && result.data && (
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Total Retrieved</Typography>
                        <Typography variant="h6">{result.data.totalRetrieved}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Records Processed</Typography>
                        <Typography variant="h6">{result.data.recordsProcessed}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Records Inserted</Typography>
                        <Typography variant="h6">{result.data.recordsInserted}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Execution Time</Typography>
                        <Typography variant="h6">{result.data.executionTimeMs}ms</Typography>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        {/* Preview Dialog */}
        <Dialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Data Preview</DialogTitle>
          <DialogContent>
            {previewData && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Found {previewData.totalRecords} records in the selected date range
                </Typography>
                
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee ID</TableCell>
                        <TableCell>Employee Name</TableCell>
                        <TableCell>Transaction Time</TableCell>
                        <TableCell>Transaction Type</TableCell>
                        <TableCell>Controller</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.sampleRecords?.slice(0, 10).map((record: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{record.EmployeeID}</TableCell>
                          <TableCell>{record.EmployeeName}</TableCell>
                          <TableCell>{formatDateTime(record.TransactionTime)}</TableCell>
                          <TableCell>{record.TransactionType}</TableCell>
                          <TableCell>{record.ControllerName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        
        {/* History Dialog */}
        <Dialog
          open={showHistory}
          onClose={() => setShowHistory(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Sync History</DialogTitle>
          <DialogContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Date Range</TableCell>
                    <TableCell>Processed</TableCell>
                    <TableCell>Inserted</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Executed At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(item.startDate)} - {formatDateTime(item.endDate)}
                      </TableCell>
                      <TableCell>{item.recordsProcessed}</TableCell>
                      <TableCell>{item.recordsInserted}</TableCell>
                      <TableCell>{item.executionTimeMs}ms</TableCell>
                      <TableCell>{formatDateTime(item.executedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHistory(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SyncAttendance;