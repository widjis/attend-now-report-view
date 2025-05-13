
import { EmployeeScheduleTable } from "@/components/EmployeeScheduleTable";

const EmployeeSchedule = () => {
  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Employee Schedule</h1>
      <p className="mb-8 text-muted-foreground">
        View employee schedules and working hours. Filter by department or company,
        and search by name or staff ID.
      </p>
      <EmployeeScheduleTable />
    </div>
  );
};

export default EmployeeSchedule;
