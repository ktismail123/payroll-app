import { MainLayout } from "@/components/layout/main-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "@/components/employee/employee-form";
import { useLocation } from "wouter";

export default function AddEmployeePage() {
  const [, navigate] = useLocation();

  const handleSuccess = (employeeId: number) => {
    navigate(`/employees/${employeeId}`);
  };

  return (
    <MainLayout>
      <Breadcrumb 
        items={[
          { label: "Employees", href: "/employees" },
          { label: "Add Employee" }
        ]} 
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-dark">Add New Employee</h1>
        <p className="text-neutral-medium">Create a new employee record with all required information</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
          <CardDescription>
            Fill in the employee details. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
