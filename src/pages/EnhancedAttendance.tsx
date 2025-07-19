import React from "react";
import { Toaster } from "sonner";
import MuiEnhancedAttendance from "@/components/MuiEnhancedAttendance";

const EnhancedAttendance = () => {
  return (
    <>
      <Toaster position="top-right" />
      <MuiEnhancedAttendance />
    </>
  );
};

export default EnhancedAttendance;
