import React from "react";
import { Toaster } from "sonner";
import SyncAttendanceComponent from "@/components/reports/SyncAttendance";

const SyncAttendance = () => {
  return (
    <>
      <Toaster position="top-right" />
      <SyncAttendanceComponent />
    </>
  );
};

export default SyncAttendance;