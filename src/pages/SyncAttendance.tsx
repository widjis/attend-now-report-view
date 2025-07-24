import React from "react";
import { Toaster } from "sonner";
import SyncAttendanceComponent from "@/components/reports/syncattendance";

const SyncAttendance = () => {
  return (
    <>
      <Toaster position="top-right" />
      <SyncAttendanceComponent />
    </>
  );
};

export default SyncAttendance;