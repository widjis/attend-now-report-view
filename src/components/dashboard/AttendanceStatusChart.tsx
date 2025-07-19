
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Box, Typography, Skeleton, useTheme } from "@mui/material";
import { StatusAttendance } from "@/types/attendance";

interface AttendanceStatusChartProps {
  data?: StatusAttendance[];
  isLoading: boolean;
}

const AttendanceStatusChart = ({ data, isLoading }: AttendanceStatusChartProps) => {
  const theme = useTheme();
  
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        height={350}
      >
        <Skeleton 
          variant="circular" 
          width={240} 
          height={240} 
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
          No data available for the selected period
        </Typography>
      </Box>
    );
  }

  const chartData = data.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value} records`, 'Count']}
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(1),
            boxShadow: theme.shadows[3],
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AttendanceStatusChart;
