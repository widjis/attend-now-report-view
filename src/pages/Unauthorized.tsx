import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Lock,
  Home,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSignIn = () => {
    if (user?.role === 'guest') {
      navigate('/login');
    } else {
      logout();
      navigate('/login');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'error.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock sx={{ fontSize: 40, color: 'error.main' }} />
            </Box>
          </Box>

          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', color: 'text.primary' }}
          >
            Access Denied
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.6 }}
          >
            {user?.role === 'guest' 
              ? "You're currently in guest mode. Sign in to access additional features and full functionality."
              : "You don't have permission to access this page. Please contact your administrator if you believe this is an error."
            }
          </Typography>

          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={handleGoHome}
              sx={{ minWidth: 140 }}
            >
              Go to Dashboard
            </Button>

            {user?.role === 'guest' ? (
              <Button
                variant="outlined"
                onClick={handleSignIn}
                sx={{ minWidth: 140 }}
              >
                Sign In
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
                sx={{ minWidth: 140 }}
              >
                Go Back
              </Button>
            )}
          </Stack>

          {user?.role === 'guest' && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mt: 3,
                p: 2,
                backgroundColor: 'warning.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.200',
              }}
            >
              <strong>Guest Mode Limitations:</strong><br />
              • Limited to Dashboard, Schedule, and Enhanced Attendance<br />
              • No data export capabilities<br />
              • No access to administrative features
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Unauthorized;