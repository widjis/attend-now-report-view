import React, { useState } from "react";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChartBarIcon, ClockIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Chart components
import AttendanceByDateChart from "@/components/dashboard/AttendanceByDateChart";
import AttendanceByControllerChart from "@/components/dashboard/AttendanceByControllerChart";
import AttendanceStatusChart from "@/components/dashboard/AttendanceStatusChart";
import AttendanceSummaryStats from "@/components/dashboard/AttendanceSummaryStats";

// API
import { fetchAttendanceSummary } from "@/api/attendanceApi";
import { AttendanceTimeframe } from "@/types/attendance";

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState<AttendanceTimeframe>("week");
  
  // Calculate date range based on selected timeframe
  const getDateRange = () => {
    const today = new Date();
    
    switch(timeframe) {
      case "day":
        return {
          startDate: format(today, "yyyy-MM-dd"),
          endDate: format(today, "yyyy-MM-dd")
        };
      case "week":
        return {
          startDate: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          endDate: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
        };
      case "month":
        return {
          startDate: format(startOfMonth(today), "yyyy-MM-dd"),
          endDate: format(endOfMonth(today), "yyyy-MM-dd")
        };
      case "quarter":
        return {
          startDate: format(subMonths(today, 3), "yyyy-MM-dd"),
          endDate: format(today, "yyyy-MM-dd")
        };
      default:
        return {
          startDate: format(subDays(today, 7), "yyyy-MM-dd"),
          endDate: format(today, "yyyy-MM-dd")
        };
    }
  };
  
  const dateRange = getDateRange();
  
  // Fetch summary data
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["attendance-summary", timeframe],
    queryFn: () => fetchAttendanceSummary(dateRange.startDate, dateRange.endDate),
  });
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Summary of attendance records and analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar size={16} />
                <span>View Attendance</span>
              </Button>
            </Link>
            <Link to="/schedule">
              <Button variant="outline" className="flex items-center gap-2">
                <ClockIcon size={16} />
                <span>Time Schedule</span>
              </Button>
            </Link>
          </div>
        </header>
        
        <Tabs defaultValue="week" className="w-full" onValueChange={(value) => setTimeframe(value as AttendanceTimeframe)}>
          <div className="mb-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
            </TabsList>
          </div>
          
          <div>
            <div className="mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ClockIcon size={20} />
                    Summary Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceSummaryStats data={summaryData} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ChartBarIcon size={20} />
                    Attendance by Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceByDateChart data={summaryData?.byDate} isLoading={isLoading} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ChartBarIcon size={20} />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceStatusChart data={summaryData?.byStatus} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ChartBarIcon size={20} />
                  Attendance by Controller
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceByControllerChart data={summaryData?.byController} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
