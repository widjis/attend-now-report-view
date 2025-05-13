
import React from "react";
import { LucideIcon, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { AttendanceSummary } from "@/types/attendance";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, description, isLoading }: StatCardProps) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {isLoading ? (
          <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
        ) : (
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        )}
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
    </div>
  </div>
);

interface AttendanceSummaryStatsProps {
  data?: AttendanceSummary;
  isLoading: boolean;
}

const AttendanceSummaryStats = ({ data, isLoading }: AttendanceSummaryStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Records"
        value={data?.totalRecords ?? 0}
        icon={Users}
        isLoading={isLoading}
      />
      <StatCard
        title="Clock Ins"
        value={data?.totalClockIn ?? 0}
        icon={Clock}
        description="Total clock in events"
        isLoading={isLoading}
      />
      <StatCard
        title="Valid Records"
        value={data?.validRecords ?? 0}
        icon={CheckCircle}
        description={`${data?.validPercentage ?? 0}% of total`}
        isLoading={isLoading}
      />
      <StatCard
        title="Invalid Records"
        value={data?.invalidRecords ?? 0}
        icon={XCircle}
        description={`${data?.invalidPercentage ?? 0}% of total`}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AttendanceSummaryStats;
