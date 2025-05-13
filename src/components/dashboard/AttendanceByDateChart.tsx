
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
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { DateAttendance } from "@/types/attendance";

interface AttendanceByDateChartProps {
  data?: DateAttendance[];
  isLoading: boolean;
}

const AttendanceByDateChart = ({ data, isLoading }: AttendanceByDateChartProps) => {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM dd");
    } catch (error) {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="h-48 w-full bg-gray-100 animate-pulse rounded"></div>
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          angle={-45}
          textAnchor="end"
          height={70}
        />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => [value, "Records"]}
          labelFormatter={(label) => format(parseISO(label), "MMMM dd, yyyy")}
        />
        <Legend />
        <Bar name="Clock In" dataKey="clockIn" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        <Bar name="Clock Out" dataKey="clockOut" fill="#a855f7" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceByDateChart;
