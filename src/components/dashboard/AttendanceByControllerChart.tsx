
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
import { Card } from "@/components/ui/card";
import { ControllerAttendance } from "@/types/attendance";

interface AttendanceByControllerChartProps {
  data?: ControllerAttendance[];
  isLoading: boolean;
}

const AttendanceByControllerChart = ({ data, isLoading }: AttendanceByControllerChartProps) => {
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
        <p className="text-muted-foreground">No controller data available for the selected period</p>
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
          bottom: 70,
        }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" />
        <YAxis 
          dataKey="controller" 
          type="category" 
          width={150}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Legend />
        <Bar name="Valid" dataKey="valid" fill="#10b981" radius={[0, 4, 4, 0]} />
        <Bar name="Invalid" dataKey="invalid" fill="#ef4444" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceByControllerChart;
