import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmployeeList } from "@/components/employee/employee-list";
import { Link } from "wouter";
import { Plus, FileUp, Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@shared/schema";

export default function EmployeesPage() {
  const { checkRole } = useAuth();
  const [canAddEmployee, setCanAddEmployee] = useState(false);
  
  const { data: employees, isLoading, error } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Check if user has HR access to add employees
  useState(() => {
    async function checkAccess() {
      const hasAccess = await checkRole('hr_staff');
      setCanAddEmployee(hasAccess);
    }
    checkAccess();
  });

  return (
    <MainLayout title="Employees" subtitle="Manage employee information">
      <Breadcrumb items={[{ label: "Employees" }]} />
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-neutral-medium">
            Total Employees: <span className="font-semibold">{employees?.length || 0}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canAddEmployee && (
            <>
              <Button variant="outline" size="sm">
                <FileUp className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link href="/employees/add">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      
      <EmployeeList
        employees={employees || []}
        isLoading={isLoading}
        error={error}
      />
    </MainLayout>
  );
}
