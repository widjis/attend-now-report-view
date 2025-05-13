
import { EmployeeScheduleTable } from "@/components/EmployeeScheduleTable";

const EmployeeSchedule = () => {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Employee Schedule</h1>
        <p className="mt-2 text-muted-foreground">
          View employee working hours and schedules
        </p>
      </div>
      
      <EmployeeScheduleTable />
    </div>
  );
};

export default EmployeeSchedule;
