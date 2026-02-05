import React from "react";
import { Toaster } from "sonner";
import SyncAttendanceComponent from "@/components/reports/SyncAttendance";
import SyncScheduleSettings from "@/components/schedule/SyncScheduleSettings";

const SyncAttendance = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <Toaster position="top-right" />
      
      <div className="px-4 md:px-0">
        <SyncScheduleSettings />
      </div>

      <div className="space-y-4">
        <div className="px-4 md:px-0">
          <h2 className="text-2xl font-bold tracking-tight">Manual Sync & History</h2>
          <p className="text-muted-foreground">
            Execute manual attendance syncs and view execution history.
          </p>
        </div>
        <SyncAttendanceComponent />
      </div>
    </div>
  );
};

export default SyncAttendance;
