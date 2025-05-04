import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export function RecentEmployees() {
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['/api/employees/recent'],
  });

  // Fetch departments for each employee's department
  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Fetch designations for each employee's designation
  const { data: designations } = useQuery({
    queryKey: ['/api/designations'],
  });

  const getDepartmentName = (departmentId: number) => {
    if (!departments) return "Unknown";
    const department = departments.find((dept: any) => dept.id === departmentId);
    return department ? department.name : "Unknown";
  };

  const getDesignationTitle = (designationId: number) => {
    if (!designations) return "Unknown";
    const designation = designations.find((des: any) => des.id === designationId);
    return designation ? designation.title : "Unknown";
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-base font-semibold">Recent Employees</CardTitle>
        <Link href="/employees">
          <a className="text-sm text-primary hover:underline">View all</a>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">
            Failed to load employees
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee: any) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-2">
                          <AvatarImage src={employee.profilePhoto || ""} alt={`${employee.firstName} ${employee.lastName}`} />
                          <AvatarFallback>{employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                          <div className="text-xs text-neutral-medium">{employee.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getDepartmentName(employee.departmentId)}</TableCell>
                    <TableCell>{getDesignationTitle(employee.designationId)}</TableCell>
                    <TableCell>{format(new Date(employee.joiningDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/employees/${employee.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <ExternalLink className="h-4 w-4" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-8 text-center text-neutral-medium">
            No employees found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
