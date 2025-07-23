import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Science as TestIcon,
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  getWhatsAppConfig,
  updateWhatsAppConfig,
  testWhatsAppConnection,
} from '../../api/reportApi';
import { WhatsAppConfig } from '../../types/report';

const WhatsAppSettings: React.FC = () => {
  // State management
  const [config, setConfig] = useState<WhatsAppConfig>({
    API_URL: '',
    TIMEOUT_SECONDS: 30,
    MAX_FILE_SIZE_MB: 10,
    ENABLED: false,
    DEFAULT_CHAT_ID: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load configuration on component mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getWhatsAppConfig();
      setConfig(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load WhatsApp configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateWhatsAppConfig(config);
      setSuccess('WhatsApp configuration saved successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save WhatsApp configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await testWhatsAppConnection();
      setTestResult({
        success: response.success,
        message: response.message,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Failed to test WhatsApp connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConfigChange = (field: keyof WhatsAppConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear messages when config changes
    setSuccess(null);
    setError(null);
    setTestResult(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        WhatsApp Integration Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Grid container spacing={2}>
                {/* Enable/Disable WhatsApp */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.ENABLED}
                        onChange={(e) => handleConfigChange('ENABLED', e.target.checked)}
                      />
                    }
                    label="Enable WhatsApp Integration"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* API URL */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="WhatsApp API URL"
                    value={config.API_URL}
                    onChange={(e) => handleConfigChange('API_URL', e.target.value)}
                    placeholder="https://your-whatsapp-api.com"
                    helperText="The base URL for your WhatsApp API service"
                    disabled={!config.ENABLED}
                  />
                </Grid>

                {/* Default Chat ID */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Chat ID"
                    value={config.DEFAULT_CHAT_ID}
                    onChange={(e) => handleConfigChange('DEFAULT_CHAT_ID', e.target.value)}
                    placeholder="120363123456789@g.us"
                    helperText="Default WhatsApp group or contact ID for sending reports"
                    disabled={!config.ENABLED}
                  />
                </Grid>

                {/* Timeout */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Timeout (Seconds)"
                    type="number"
                    value={config.TIMEOUT_SECONDS}
                    onChange={(e) => handleConfigChange('TIMEOUT_SECONDS', Number(e.target.value))}
                    helperText="Request timeout in seconds"
                    disabled={!config.ENABLED}
                    inputProps={{ min: 1, max: 300 }}
                  />
                </Grid>

                {/* Max File Size */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max File Size (MB)"
                    type="number"
                    value={config.MAX_FILE_SIZE_MB}
                    onChange={(e) => handleConfigChange('MAX_FILE_SIZE_MB', Number(e.target.value))}
                    helperText="Maximum file size for attachments"
                    disabled={!config.ENABLED}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || !config.ENABLED}
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={testing ? <CircularProgress size={20} /> : <TestIcon />}
                  onClick={handleTest}
                  disabled={testing || !config.ENABLED || !config.API_URL}
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>

              {/* Integration Status */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WhatsAppIcon color={config.ENABLED ? 'success' : 'disabled'} />
                  <Typography variant="subtitle2">
                    Integration Status
                  </Typography>
                </Box>
                <Chip
                  label={config.ENABLED ? 'Enabled' : 'Disabled'}
                  color={config.ENABLED ? 'success' : 'default'}
                  size="small"
                />
              </Paper>

              {/* Test Result */}
              {testResult && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {testResult.success ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                    <Typography variant="subtitle2">
                      Connection Test
                    </Typography>
                  </Box>
                  <Typography variant="body2" color={testResult.success ? 'success.main' : 'error.main'}>
                    {testResult.message}
                  </Typography>
                </Paper>
              )}

              {/* Configuration Summary */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Configuration Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  API URL: {config.API_URL || 'Not configured'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Default Chat: {config.DEFAULT_CHAT_ID || 'Not configured'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Timeout: {config.TIMEOUT_SECONDS}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max File Size: {config.MAX_FILE_SIZE_MB}MB
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Help
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                To use WhatsApp integration, you need to set up a WhatsApp Business API service.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The Chat ID format depends on your API provider:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                • Group: 120363123456789@g.us
                <br />
                • Contact: 1234567890@c.us
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WhatsAppSettings;