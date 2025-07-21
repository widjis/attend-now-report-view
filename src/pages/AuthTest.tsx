import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types/auth';
import axios from 'axios';
import { Refresh as RefreshIcon, Logout as LogoutIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:5001/api';

const AuthTest: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout, error: authError } = useAuth();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [endpoint, setEndpoint] = useState('/auth/check');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      setCredentials({ username: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    setApiResponse(null);
    setApiError(null);
  };

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const testEndpoint = async () => {
    setApiLoading(true);
    setApiResponse(null);
    setApiError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}${endpoint}`, { headers });
      setApiResponse(response.data);
    } catch (error: any) {
      console.error('API error:', error);
      setApiError(error.response?.data?.message || error.message || 'Unknown error');
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Authentication Test Page
      </Typography>
      
      <Grid container spacing={3}>
        {/* Auth Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Authentication Status" 
              action={
                <Chip 
                  label={isAuthenticated ? 'Authenticated' : 'Not Authenticated'} 
                  color={isAuthenticated ? 'success' : 'error'}
                  variant="outlined"
                />
              }
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : isAuthenticated ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    User Details:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0, overflow: 'auto' }}>
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </Paper>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ mt: 2 }}
                  >
                    Logout
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleLogin}>
                  <Stack spacing={2}>
                    <TextField
                      label="Username"
                      value={credentials.username}
                      onChange={handleInputChange('username')}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={credentials.password}
                      onChange={handleInputChange('password')}
                      fullWidth
                      required
                    />
                    {authError && <Alert severity="error">{authError}</Alert>}
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* API Test Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="API Endpoint Test" 
              subheader="Test authenticated API endpoints"
            />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="API Endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  fullWidth
                  placeholder="/auth/check"
                  helperText={`Will call: ${API_URL}${endpoint}`}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={testEndpoint}
                  disabled={apiLoading}
                  startIcon={apiLoading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                >
                  Test Endpoint
                </Button>
                
                {apiError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {apiError}
                  </Alert>
                )}
                
                {apiResponse && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Response:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <pre style={{ margin: 0, overflow: 'auto' }}>
                        {JSON.stringify(apiResponse, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Available Test Endpoints
        </Typography>
        <Paper>
          <List>
            <ListItem>
              <ListItemText 
                primary="/auth/check" 
                secondary="Verify authentication status" 
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="/auth/me" 
                secondary="Get current user details" 
              />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthTest;