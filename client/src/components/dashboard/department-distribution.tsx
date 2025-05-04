import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface DepartmentCount {
  departmentId: number;
  departmentName: string;
  count: number;
}

const colors = [
  "bg-primary",
  "bg-secondary",
  "bg-success",
  "bg-info",
  "bg-warning",
  "bg-destructive",
  "bg-purple-500",
  "bg-indigo-500",
];

export function DepartmentDistribution() {
  const { data: departmentCounts, isLoading, error } = useQuery<DepartmentCount[]>({
    queryKey: ['/api/employees/departments/count'],
  });

  const getTotalEmployees = () => {
    if (!departmentCounts) return 0;
    return departmentCounts.reduce((sum, dept) => sum + dept.count, 0);
  };

  const getPercentage = (count: number) => {
    const total = getTotalEmployees();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-base font-semibold">Department Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">
            Failed to load department data
          </div>
        ) : departmentCounts && departmentCounts.length > 0 ? (
          <div className="space-y-4">
            {departmentCounts.map((dept, index) => (
              <div key={dept.departmentId}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-dark">{dept.departmentName}</span>
                  <span className="text-sm text-neutral-medium">{dept.count} employees</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${colors[index % colors.length]} h-2 rounded-full`} 
                    style={{ width: `${getPercentage(dept.count)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-neutral-medium">
            No department data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
