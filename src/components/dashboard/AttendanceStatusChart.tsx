
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { StatusAttendance } from "@/types/attendance";

interface AttendanceStatusChartProps {
  data?: StatusAttendance[];
  isLoading: boolean;
}

const COLORS = ["#4f46e5", "#a855f7", "#ef4444", "#10b981"];

const AttendanceStatusChart = ({ data, isLoading }: AttendanceStatusChartProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="h-48 w-48 bg-gray-100 animate-pulse rounded-full"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="flex items-center justify-center h-72 border-dashed">
        <p className="text-muted-foreground">No data available for the selected period</p>
      </Card>
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
        <Tooltip formatter={(value) => [`${value} records`, 'Count']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AttendanceStatusChart;
