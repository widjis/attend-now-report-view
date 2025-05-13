
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRound, BarChart3, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center gap-8 py-10">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold">Attendance Report System</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          View and analyze employee attendance records, generate reports, and manage employee schedules.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              <span>Attendance Records</span>
            </CardTitle>
            <CardDescription>
              View and filter employee attendance records
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <p className="text-sm">
              Access detailed attendance logs, filter by date, department, or
              individual employees.
            </p>
            <Button asChild className="mt-auto w-full">
              <Link to="/">View Records</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </CardTitle>
            <CardDescription>
              Attendance analytics and statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <p className="text-sm">
              View charts and statistics for attendance trends, entry/exit
              patterns, and department summaries.
            </p>
            <Button asChild className="mt-auto w-full">
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Employee Schedule</span>
            </CardTitle>
            <CardDescription>
              View employee working hours
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <p className="text-sm">
              Access employee schedules, time in and time out, filtered by department or company.
            </p>
            <Button asChild className="mt-auto w-full">
              <Link to="/employee-schedule">View Schedule</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
