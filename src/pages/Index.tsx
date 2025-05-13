const Index = () => {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Attendance Records</h1>
        <p className="mt-2 text-muted-foreground">
          View and filter employee attendance records
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-6">
        <p className="mb-4">
          Access detailed attendance logs, filter by date, department, or individual employees.
        </p>
        
        {/* Here you would include your AttendanceTable component */}
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">Attendance data will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
