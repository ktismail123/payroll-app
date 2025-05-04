import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DepartmentDistribution } from "@/components/dashboard/department-distribution";
import { RecentEmployees } from "@/components/dashboard/recent-employees";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Users, DollarSign, Building2, AlertTriangle } from "lucide-react";
import { formatter } from "@/lib/utils";

interface DashboardData {
  stats: {
    employeeCount: number;
    totalPayroll: number;
    departmentCount: number;
    pendingApprovalsCount: number;
  };
  recentEmployees: any[];
  recentActivity: any[];
  departmentCounts: {
    departmentId: number;
    departmentName: string;
    count: number;
  }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
            <p className="text-neutral-medium">{error.message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.username}`}
    >
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={data?.stats.employeeCount || 0}
          icon={<Users className="h-5 w-5 text-primary" />}
          iconBgColor="bg-blue-100"
          trend={{
            value: 12,
            label: "from last month",
            isPositive: true,
          }}
        />
        
        <StatCard
          title="Total Payroll"
          value={formatter.format(data?.stats.totalPayroll || 0)}
          icon={<DollarSign className="h-5 w-5 text-success" />}
          iconBgColor="bg-green-100"
          trend={{
            value: 8,
            label: "from last month",
            isPositive: true,
          }}
        />
        
        <StatCard
          title="Departments"
          value={data?.stats.departmentCount || 0}
          icon={<Building2 className="h-5 w-5 text-warning" />}
          iconBgColor="bg-yellow-100"
        />
        
        <StatCard
          title="Pending Approvals"
          value={data?.stats.pendingApprovalsCount || 0}
          icon={<AlertTriangle className="h-5 w-5 text-error" />}
          iconBgColor="bg-red-100"
          action={{
            label: "View all",
            href: "/payroll",
          }}
        />
      </div>
      
      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
      
      {/* Department Distribution and Recent Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <DepartmentDistribution />
        </div>
        <div className="lg:col-span-2">
          <RecentEmployees />
        </div>
      </div>
    </MainLayout>
  );
}
