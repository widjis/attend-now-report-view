
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
import { parseISO } from "date-fns";
import { Box, Typography, Skeleton, useTheme } from "@mui/material";
import { DateAttendance } from "@/types/attendance";
import dayjs from "dayjs";

interface AttendanceByDateChartProps {
  data?: DateAttendance[];
  isLoading: boolean;
}

const AttendanceByDateChart = ({ data, isLoading }: AttendanceByDateChartProps) => {
  const theme = useTheme();
  
  const formatDate = (dateStr: string) => {
    try {
      return dayjs(parseISO(dateStr)).format("MMM DD");
    } catch (error) {
      return dateStr;
    }
  };

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
          No data available for the selected period
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
          bottom: 30,
        }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke={theme.palette.divider}
        />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          angle={-45}
          textAnchor="end"
          height={70}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <YAxis 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number) => [value, "Records"]}
          labelFormatter={(label) => dayjs(parseISO(label)).format("MMMM DD, YYYY")}
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(1),
            boxShadow: theme.shadows[3],
          }}
        />
        <Legend />
        <Bar 
          name="Clock In" 
          dataKey="clockIn" 
          fill={theme.palette.primary.main} 
          radius={[4, 4, 0, 0]} 
        />
        <Bar 
          name="Clock Out" 
          dataKey="clockOut" 
          fill={theme.palette.secondary.main} 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceByDateChart;
