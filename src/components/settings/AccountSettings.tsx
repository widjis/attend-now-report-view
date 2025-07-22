import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  IconButton,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface SystemSettings {
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUppercase: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  ldapEnabled: boolean;
  ldapServer?: string;
  ldapPort?: number;
  ldapBindDN?: string;
  ldapBindPassword?: string;
  ldapSearchBase?: string;
}

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLdapPassword, setShowLdapPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    allowUserRegistration: false,
    requireEmailVerification: true,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    passwordRequireNumber: true,
    passwordRequireUppercase: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    ldapEnabled: false,
    ldapServer: '',
    ldapPort: 389,
    ldapBindDN: '',
    ldapBindPassword: '',
    ldapSearchBase: '',
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // In a real application, you would fetch settings from the backend
  const fetchSettings = async () => {
    setLoading(true);
    try {
      // This would be replaced with an actual API call
      // const response = await axios.get('http://localhost:5001/api/settings');
      // setSystemSettings(response.data.settings);
      
      // For now, we're using the hardcoded settings
      setLoading(false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setSnackbar({
        open: true,
        message: 'Failed to fetch system settings',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Check if this is a checkbox event
    if ('type' in e.target && e.target.type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    setSystemSettings(prev => ({
      ...prev,
      [name as string]: newValue,
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < systemSettings.passwordMinLength) {
      setPasswordError(`Password must be at least ${systemSettings.passwordMinLength} characters`);
      return;
    }
    
    if (systemSettings.passwordRequireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordError('Password must include at least one special character');
      return;
    }
    
    if (systemSettings.passwordRequireNumber && !/\d/.test(newPassword)) {
      setPasswordError('Password must include at least one number');
      return;
    }
    
    if (systemSettings.passwordRequireUppercase && !/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must include at least one uppercase letter');
      return;
    }
    
    setPasswordError(null);
    setLoading(true);
    
    try {
      // This would be replaced with an actual API call
      // await axios.post('http://localhost:5001/api/auth/change-password', {
      //   currentPassword,
      //   newPassword,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({
        open: true,
        message: 'Password changed successfully',
        severity: 'success',
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      setSnackbar({
        open: true,
        message: 'Failed to change password',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // This would be replaced with an actual API call
      // await axios.put('http://localhost:5001/api/settings', systemSettings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom>
        Account Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Password Change Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">Change Password</Typography>
                </Box>
              } 
            />
            <Divider />
            <CardContent>
              <Box component="form" onSubmit={handlePasswordChange} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                {passwordError && (
                  <Alert severity="error">{passwordError}</Alert>
                )}
                
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon color="primary" />
                  <Typography variant="h6">System Settings</Typography>
                </Box>
              } 
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1">Authentication Settings</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.allowUserRegistration}
                            onChange={handleSettingsChange}
                            name="allowUserRegistration"
                            color="primary"
                          />
                        }
                        label="Allow User Registration"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.requireEmailVerification}
                            onChange={handleSettingsChange}
                            name="requireEmailVerification"
                            color="primary"
                            disabled={!systemSettings.allowUserRegistration}
                          />
                        }
                        label="Require Email Verification"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Session Timeout (minutes)"
                        type="number"
                        name="sessionTimeout"
                        value={systemSettings.sessionTimeout}
                        onChange={handleSettingsChange}
                        fullWidth
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Max Login Attempts"
                        type="number"
                        name="maxLoginAttempts"
                        value={systemSettings.maxLoginAttempts}
                        onChange={handleSettingsChange}
                        fullWidth
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="subtitle1">Password Policy</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Minimum Length"
                        type="number"
                        name="passwordMinLength"
                        value={systemSettings.passwordMinLength}
                        onChange={handleSettingsChange}
                        fullWidth
                        InputProps={{ inputProps: { min: 4 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.passwordRequireSpecialChar}
                            onChange={handleSettingsChange}
                            name="passwordRequireSpecialChar"
                            color="primary"
                          />
                        }
                        label="Require Special Character"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.passwordRequireNumber}
                            onChange={handleSettingsChange}
                            name="passwordRequireNumber"
                            color="primary"
                          />
                        }
                        label="Require Number"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.passwordRequireUppercase}
                            onChange={handleSettingsChange}
                            name="passwordRequireUppercase"
                            color="primary"
                          />
                        }
                        label="Require Uppercase"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="subtitle1">LDAP Integration</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.ldapEnabled}
                            onChange={handleSettingsChange}
                            name="ldapEnabled"
                            color="primary"
                          />
                        }
                        label="Enable LDAP Authentication"
                      />
                    </Grid>
                    
                    {systemSettings.ldapEnabled && (
                      <>
                        <Grid item xs={12} sm={8}>
                          <TextField
                            label="LDAP Server"
                            name="ldapServer"
                            value={systemSettings.ldapServer}
                            onChange={handleSettingsChange}
                            fullWidth
                            placeholder="ldap.example.com"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="LDAP Port"
                            type="number"
                            name="ldapPort"
                            value={systemSettings.ldapPort}
                            onChange={handleSettingsChange}
                            fullWidth
                            placeholder="389"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Bind DN"
                            name="ldapBindDN"
                            value={systemSettings.ldapBindDN}
                            onChange={handleSettingsChange}
                            fullWidth
                            placeholder="cn=admin,dc=example,dc=com"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Bind Password"
                            type={showLdapPassword ? 'text' : 'password'}
                            name="ldapBindPassword"
                            value={systemSettings.ldapBindPassword}
                            onChange={handleSettingsChange}
                            fullWidth
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowLdapPassword(!showLdapPassword)}
                                    edge="end"
                                  >
                                    {showLdapPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Search Base"
                            name="ldapSearchBase"
                            value={systemSettings.ldapSearchBase}
                            onChange={handleSettingsChange}
                            fullWidth
                            placeholder="dc=example,dc=com"
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Paper>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveSettings}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ mt: 2 }}
                >
                  Save Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountSettings;