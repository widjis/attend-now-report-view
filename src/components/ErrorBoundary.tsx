import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            maxWidth: 500, 
            mx: 'auto', 
            mt: 4 
          }}
        >
          <ErrorIcon 
            color="error" 
            sx={{ fontSize: 64, mb: 2 }} 
          />
          <Typography variant="h5" gutterBottom color="error">
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            An unexpected error occurred while loading this component.
          </Typography>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box 
              component="pre" 
              sx={{ 
                textAlign: 'left', 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                fontSize: '0.875rem',
                overflow: 'auto',
                mb: 2
              }}
            >
              {this.state.error.message}
            </Box>
          )}
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleRetry}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;