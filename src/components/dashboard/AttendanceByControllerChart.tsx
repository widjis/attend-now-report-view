
import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { Box, Typography, Skeleton, useTheme } from "@mui/material";
import { ControllerAttendance } from "@/types/attendance";

interface AttendanceByControllerChartProps {
  data?: ControllerAttendance[];
  isLoading: boolean;
}

const AttendanceByControllerChart = ({ data, isLoading }: AttendanceByControllerChartProps) => {
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        height={350}
      >
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={300} 
          sx={{ borderRadius: 2 }}
        />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        height={350}
        sx={{
          border: `2px dashed ${theme.palette.divider}`,
          borderRadius: 2,
          bgcolor: 'grey.50'
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No controller data available for the selected period
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 70,
        }}
        layout="vertical"
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          horizontal={true} 
          vertical={false} 
          stroke={theme.palette.divider}
        />
        <XAxis 
          type="number" 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <YAxis 
          dataKey="controller" 
          type="category" 
          width={150}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(1),
            boxShadow: theme.shadows[3],
          }}
        />
        <Legend />
        <Bar 
          name="Valid" 
          dataKey="valid" 
          fill={theme.palette.success.main} 
          radius={[0, 4, 4, 0]} 
        />
        <Bar 
          name="Invalid" 
          dataKey="invalid" 
          fill={theme.palette.error.main} 
          radius={[0, 4, 4, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceByControllerChart;
