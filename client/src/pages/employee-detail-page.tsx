import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  Building, 
  BadgeCheck, 
  DollarSign, 
  FileText, 
  Loader2,
  Edit,
  AlertTriangle,
  UserMinus
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { EmployeeForm } from "@/components/employee/employee-form";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { checkRole } = useAuth();
  const [canEditEmployee, setCanEditEmployee] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const numericId = parseInt(id as string);

  // Fetch employee details
  const { 
    data: employee, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/employees/${id}`],
  });

  // Fetch department
  const { data: department } = useQuery({
    queryKey: [`/api/departments/${employee?.departmentId}`],
    enabled: !!employee?.departmentId,
  });

  // Fetch designation
  const { data: designation } = useQuery({
    queryKey: [`/api/designations/${employee?.designationId}`],
    enabled: !!employee?.designationId,
  });

  // Fetch salary structure
  const { data: salary } = useQuery({
    queryKey: [`/api/salary-structures/current/${id}`],
    enabled: !!id,
  });

  // Fetch documents
  const { data: documents } = useQuery({
    queryKey: [`/api/documents/employee/${id}`],
    enabled: !!id,
  });

  // Terminate employee mutation
  const terminateEmployeeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/employees/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Employee terminated",
        description: "The employee has been marked as terminated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to terminate employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user has HR access to edit employees
  useEffect(() => {
    async function checkAccess() {
      const hasAccess = await checkRole('hr_staff');
      setCanEditEmployee(hasAccess);
    }
    checkAccess();
  }, [checkRole]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !employee) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold">Employee Not Found</h2>
          <p className="text-neutral-medium mt-1">
            The employee you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <Breadcrumb 
        items={[
          { label: "Employees", href: "/employees" },
          { label: `${employee.firstName} ${employee.lastName}` }
        ]} 
      />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">
            {employee.firstName} {employee.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-neutral-medium">
              {designation?.title || 'No Designation'}
            </span>
            <span className="text-neutral-medium mx-1">•</span>
            <span className="text-neutral-medium">
              {department?.name || 'No Department'}
            </span>
            <Badge className={getStatusColor(employee.status || 'active')}>
              {employee.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : 'Active'}
            </Badge>
          </div>
        </div>
        
        {canEditEmployee && (
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Employee</DialogTitle>
                </DialogHeader>
                <EmployeeForm 
                  employeeData={employee} 
                  isEditing={true}
                  onSuccess={() => {
                    setIsEditDialogOpen(false);
                    refetch();
                  }}
                />
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <UserMinus className="h-4 w-4 mr-2" />
                  Terminate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Terminate Employee
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-neutral-dark">
                    Are you sure you want to terminate <span className="font-semibold">{employee.firstName} {employee.lastName}</span>?
                    This action will mark the employee as terminated but will preserve all records.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => terminateEmployeeMutation.mutate()}
                    disabled={terminateEmployeeMutation.isPending}
                  >
                    {terminateEmployeeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Termination"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          {/* Employee Profile Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={employee.profilePhoto || ""} alt={`${employee.firstName} ${employee.lastName}`} />
                  <AvatarFallback className="text-lg">
                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-center">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-neutral-medium text-center mb-4">
                  {employee.employeeId}
                </p>
                
                <div className="w-full space-y-3 mt-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-neutral-medium" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-neutral-medium" />
                    <span className="text-sm">{employee.phoneNumber || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-neutral-medium" />
                    <span className="text-sm">
                      Joined {employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-neutral-medium mt-0.5" />
                    <span className="text-sm">{employee.currentAddress || 'No address specified'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Salary Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-success" />
                Salary Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {salary ? (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-neutral-medium">Basic Salary</span>
                    <span className="text-sm font-medium">${salary.basicSalary}</span>
                  </div>
                  {salary.houseRentAllowance && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-neutral-medium">House Rent Allowance</span>
                      <span className="text-sm font-medium">${salary.houseRentAllowance}</span>
                    </div>
                  )}
                  {salary.conveyanceAllowance && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-neutral-medium">Conveyance Allowance</span>
                      <span className="text-sm font-medium">${salary.conveyanceAllowance}</span>
                    </div>
                  )}
                  {salary.medicalAllowance && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-neutral-medium">Medical Allowance</span>
                      <span className="text-sm font-medium">${salary.medicalAllowance}</span>
                    </div>
                  )}
                  {salary.specialAllowance && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-neutral-medium">Special Allowance</span>
                      <span className="text-sm font-medium">${salary.specialAllowance}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 pt-3">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-base font-semibold text-success">
                      ${(
                        Number(salary.basicSalary) +
                        Number(salary.houseRentAllowance || 0) +
                        Number(salary.conveyanceAllowance || 0) +
                        Number(salary.medicalAllowance || 0) +
                        Number(salary.specialAllowance || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-medium pt-2">
                    Effective from {format(new Date(salary.effectiveFrom), 'MMM dd, yyyy')}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-neutral-medium">
                  No salary information available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal">
            <TabsList className="w-full">
              <TabsTrigger value="personal" className="flex-1">Personal Information</TabsTrigger>
              <TabsTrigger value="employment" className="flex-1">Employment Details</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-base font-semibold mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-neutral-medium" />
                        Personal Details
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-neutral-medium">Full Name</label>
                          <p className="text-sm font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Date of Birth</label>
                          <p className="text-sm font-medium">
                            {employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'MMM dd, yyyy') : 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Gender</label>
                          <p className="text-sm font-medium capitalize">
                            {employee.gender || 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Blood Group</label>
                          <p className="text-sm font-medium">
                            {employee.bloodGroup || 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Marital Status</label>
                          <p className="text-sm font-medium capitalize">
                            {employee.maritalStatus || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-semibold mb-4 flex items-center">
                        <Phone className="h-5 w-5 mr-2 text-neutral-medium" />
                        Contact Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-neutral-medium">Email Address</label>
                          <p className="text-sm font-medium">{employee.email}</p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Phone Number</label>
                          <p className="text-sm font-medium">
                            {employee.phoneNumber || 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Emergency Contact</label>
                          <p className="text-sm font-medium">
                            {employee.emergencyContact || 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Current Address</label>
                          <p className="text-sm font-medium">
                            {employee.currentAddress || 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Permanent Address</label>
                          <p className="text-sm font-medium">
                            {employee.permanentAddress || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="employment" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-base font-semibold mb-4 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-neutral-medium" />
                        Company Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-neutral-medium">Employee ID</label>
                          <p className="text-sm font-medium">{employee.employeeId}</p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Department</label>
                          <p className="text-sm font-medium">
                            {department?.name || 'Not assigned'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Designation</label>
                          <p className="text-sm font-medium">
                            {designation?.title || 'Not assigned'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Reporting Manager</label>
                          <p className="text-sm font-medium">
                            {employee.reportingManagerId ? 'Assigned' : 'Not assigned'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-semibold mb-4 flex items-center">
                        <BadgeCheck className="h-5 w-5 mr-2 text-neutral-medium" />
                        Employment Details
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-neutral-medium">Joining Date</label>
                          <p className="text-sm font-medium">
                            {employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM dd, yyyy') : 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Employment Type</label>
                          <p className="text-sm font-medium capitalize">
                            {employee.employmentType ? employee.employmentType.replace('_', ' ') : 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs text-neutral-medium">Status</label>
                          <p className="text-sm font-medium capitalize">
                            {employee.status || 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-neutral-medium" />
                    Uploaded Documents
                  </h3>
                  
                  {documents && documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-neutral-medium mr-3" />
                            <div>
                              <p className="text-sm font-medium">{doc.documentName}</p>
                              <p className="text-xs text-neutral-medium">{doc.documentType}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-neutral-medium">
                      <FileText className="h-10 w-10 text-neutral-medium mx-auto mb-2" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                  
                  {canEditEmployee && (
                    <div className="mt-6">
                      <Button className="w-full">
                        Upload New Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
