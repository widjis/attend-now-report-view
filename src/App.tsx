
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { muiTheme } from "./theme/muiTheme";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import EnhancedAttendance from "./pages/EnhancedAttendance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/enhanced-attendance" replace />} />
          {/* Hide the attendance-report route by commenting it out */}
          {/* <Route path="/attendance-report" element={<Index />} /> */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/enhanced-attendance" element={<EnhancedAttendance />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
