import { useState } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, MoreHorizontal, Eye, Edit, Trash2, Filter } from "lucide-react";
import { Employee } from "@shared/schema";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface EmployeeListProps {
  employees: Employee[];
  isLoading: boolean;
  error: Error | null;
}

export function EmployeeList({ employees, isLoading, error }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<number | null>(null);
  
  // Fetch departments for filtering
  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Fetch designations for display
  const { data: designations } = useQuery({
    queryKey: ['/api/designations'],
  });

  // Filter employees based on search term and department filter
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === "" || 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === null || employee.departmentId === filterDepartment;
    
    return matchesSearch && matchesDepartment;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Terminated</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load employees</h3>
          <p className="text-neutral-medium max-w-md">
            {error.message || "An error occurred while fetching employee data. Please try again later."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <CardTitle>Employee List</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-medium" />
              <Input
                placeholder="Search employees..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterDepartment(null)}>
                  All Departments
                </DropdownMenuItem>
                {departments?.map((department: any) => (
                  <DropdownMenuItem 
                    key={department.id} 
                    onClick={() => setFilterDepartment(department.id)}
                  >
                    {department.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
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
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>{employee.departmentId ? getDepartmentName(employee.departmentId) : "—"}</TableCell>
                    <TableCell>{employee.designationId ? getDesignationTitle(employee.designationId) : "—"}</TableCell>
                    <TableCell>{employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM dd, yyyy') : "—"}</TableCell>
                    <TableCell>{getStatusBadge(employee.status || 'active')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Link href={`/employees/${employee.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/employees/${employee.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Terminate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-neutral-medium">No employees found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
