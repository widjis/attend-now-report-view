
import { useState, useEffect } from "react";
import AttendanceSummaryStats from "@/components/dashboard/AttendanceSummaryStats";
import AttendanceByDateChart from "@/components/dashboard/AttendanceByDateChart";
import AttendanceStatusChart from "@/components/dashboard/AttendanceStatusChart";
import AttendanceByControllerChart from "@/components/dashboard/AttendanceByControllerChart";

const Dashboard = () => {
  // Add a loading state to pass to the components
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    // In a real app, this would be replaced with actual API calls
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Attendance analytics and statistics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AttendanceSummaryStats isLoading={isLoading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AttendanceByDateChart isLoading={isLoading} />
        <AttendanceStatusChart isLoading={isLoading} />
      </div>

      <div className="mt-6">
        <AttendanceByControllerChart isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Dashboard;
