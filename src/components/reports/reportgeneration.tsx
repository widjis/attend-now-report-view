import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  PlayArrow as GenerateIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { generateReport, getControllers } from '../../api/reportapi';
import { ReportGenerationParams, ReportGenerationResult } from '../../types/report';

const ReportGeneration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [controllers, setControllers] = useState<string[]>([]);
  const [loadingControllers, setLoadingControllers] = useState(false);
  const [result, setResult] = useState<ReportGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date | null>(new Date());
  const [selectedControllers, setSelectedControllers] = useState<string[]>([]);
  const [insertToAttendanceReport, setInsertToAttendanceReport] = useState(false);
  const [insertToMcgClocking, setInsertToMcgClocking] = useState(false);
  const [useFilo, setUseFilo] = useState(false);
  const [toleranceSeconds, setToleranceSeconds] = useState<number>(300);
  const [whatsappChatId, setWhatsappChatId] = useState<string>('');
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [manualTimeIn, setManualTimeIn] = useState<string>('');
  const [manualTimeOut, setManualTimeOut] = useState<string>('');
  const [useManualTimes, setUseManualTimes] = useState(false);

  // Load controllers on component mount
  useEffect(() => {
    loadControllers();
  }, []);

  const loadControllers = async () => {
    try {
      setLoadingControllers(true);
      const response = await getControllers();
      if (response.success) {
        setControllers(response.data);
      }
    } catch (err) {
      console.error('Failed to load controllers:', err);
    } finally {
      setLoadingControllers(false);
    }
  };

  const handleGenerate = async () => {
    if (!startDateTime || !endDateTime) {
      setError('Please select both start and end date/time');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const params: ReportGenerationParams = {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        controllerList: selectedControllers.length > 0 ? selectedControllers : undefined,
        insertToAttendanceReport,
        insertToMcgClocking,
        useFilo,
        toleranceSeconds,
        whatsappChatId: whatsappChatId.trim() || undefined,
        sendWhatsApp,
        manualTimes: useManualTimes && manualTimeIn && manualTimeOut ? {
          timeIn: manualTimeIn,
          timeOut: manualTimeOut,
        } : null,
      };

      const response = await generateReport(params);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDateTime(new Date());
    setEndDateTime(new Date());
    setSelectedControllers([]);
    setInsertToAttendanceReport(false);
    setInsertToMcgClocking(false);
    setUseFilo(false);
    setToleranceSeconds(300);
    setWhatsappChatId('');
    setSendWhatsApp(false);
    setManualTimeIn('');
    setManualTimeOut('');
    setUseManualTimes(false);
    setResult(null);
    setError(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Generate Attendance Report
        </Typography>

        {/* Configuration Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report Configuration
            </Typography>
            
            <Grid container spacing={3}>
              {/* Date/Time Selection */}
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={startDateTime}
                  onChange={setStartDateTime}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="End Date & Time"
                  value={endDateTime}
                  onChange={setEndDateTime}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              {/* Controller Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Controllers (Optional)</InputLabel>
                  <Select
                    multiple
                    value={selectedControllers}
                    onChange={(e) => setSelectedControllers(e.target.value as string[])}
                    disabled={loadingControllers}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {controllers.map((controller) => (
                      <MenuItem key={controller} value={controller}>
                        {controller}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Processing Options */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Processing Options
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={insertToAttendanceReport}
                        onChange={(e) => setInsertToAttendanceReport(e.target.checked)}
                      />
                    }
                    label="Insert to Attendance Report Table"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={insertToMcgClocking}
                        onChange={(e) => setInsertToMcgClocking(e.target.checked)}
                      />
                    }
                    label="Insert to MCG Clocking Table"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useFilo}
                        onChange={(e) => setUseFilo(e.target.checked)}
                      />
                    }
                    label="Use FILO (First In, Last Out) Logic"
                  />
                </Box>
              </Grid>

              {/* Tolerance Settings */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tolerance (Seconds)"
                  type="number"
                  value={toleranceSeconds}
                  onChange={(e) => setToleranceSeconds(Number(e.target.value))}
                  helperText="Time tolerance for matching records"
                />
              </Grid>

              {/* Manual Times */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useManualTimes}
                      onChange={(e) => setUseManualTimes(e.target.checked)}
                    />
                  }
                  label="Use Manual Times"
                />
                {useManualTimes && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Manual Time In"
                        type="time"
                        value={manualTimeIn}
                        onChange={(e) => setManualTimeIn(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Manual Time Out"
                        type="time"
                        value={manualTimeOut}
                        onChange={(e) => setManualTimeOut(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Grid>

              {/* WhatsApp Settings */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  WhatsApp Integration
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                    />
                  }
                  label="Send Report via WhatsApp"
                />
                {sendWhatsApp && (
                  <TextField
                    fullWidth
                    label="WhatsApp Chat ID"
                    value={whatsappChatId}
                    onChange={(e) => setWhatsappChatId(e.target.value)}
                    sx={{ mt: 2 }}
                    helperText="Optional: Leave empty to use default chat ID"
                  />
                )}
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <GenerateIcon />}
                onClick={handleGenerate}
                disabled={loading}
                size="large"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadControllers}
                disabled={loadingControllers}
              >
                Refresh Controllers
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generation Results
              </Typography>
              
              {result.success ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {result.message}
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {result.message}
                </Alert>
              )}

              {result.data?.report && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {result.data.report.recordsProcessed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Records Processed
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {result.data.report.recordsInserted}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Records Inserted
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {result.data.report.recordsSkipped}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Records Skipped
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {(result.data.report.executionTime / 1000).toFixed(2)}s
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Execution Time
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {result.data?.whatsapp && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <WhatsAppIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    WhatsApp Status
                  </Typography>
                  <Alert severity={result.data.whatsapp.success ? 'success' : 'error'}>
                    {result.data.whatsapp.message}
                    {result.data.whatsapp.chatId && (
                      <Typography variant="caption" display="block">
                        Chat ID: {result.data.whatsapp.chatId}
                      </Typography>
                    )}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ReportGeneration;