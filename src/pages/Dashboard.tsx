
import AttendanceSummaryStats from "@/components/dashboard/AttendanceSummaryStats";
import AttendanceByDateChart from "@/components/dashboard/AttendanceByDateChart";
import AttendanceStatusChart from "@/components/dashboard/AttendanceStatusChart";
import AttendanceByControllerChart from "@/components/dashboard/AttendanceByControllerChart";

const Dashboard = () => {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Attendance analytics and statistics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AttendanceSummaryStats />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AttendanceByDateChart />
        <AttendanceStatusChart />
      </div>

      <div className="mt-6">
        <AttendanceByControllerChart />
      </div>
    </div>
  );
};

export default Dashboard;
