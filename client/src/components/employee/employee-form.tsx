import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Create schema based on the backend schema but with client-side validation
const employeeFormSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  
  // Contact Information
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  
  // Employment Details
  departmentId: z.number().nullable().optional(),
  designationId: z.number().nullable().optional(),
  reportingManagerId: z.number().nullable().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract"]).default("full_time"),
  joiningDate: z.string().min(1, "Joining date is required"),
  
  // User Account Information
  userId: z.number().nullable().optional(),
  profilePhoto: z.string().optional(),
  status: z.enum(["active", "inactive", "terminated"]).default("active"),
  
  // This field is technically required in the schema, but will be generated on the server
  employeeId: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employeeData?: any;
  isEditing?: boolean;
  onSuccess?: (employeeId: number) => void;
}

export function EmployeeForm({ employeeData, isEditing = false, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  
  // Fetch departments for dropdown
  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });
  
  // Fetch designations for dropdown
  const { data: designations, refetch: refetchDesignations } = useQuery({
    queryKey: ['/api/designations'],
  });

  // Fetch employees for reporting manager dropdown
  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      return await apiRequest("POST", "/api/employees", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Employee created",
        description: "The employee has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: EmployeeFormValues }) => {
      return await apiRequest("PUT", `/api/employees/${id}`, data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Employee updated",
        description: "The employee has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${data.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set up form with default values
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: undefined,
      bloodGroup: undefined,
      maritalStatus: undefined,
      email: "",
      phoneNumber: "",
      emergencyContact: "",
      currentAddress: "",
      permanentAddress: "",
      departmentId: null,
      designationId: null,
      reportingManagerId: null,
      employmentType: "full_time",
      joiningDate: new Date().toISOString().slice(0, 10),
      userId: null,
      profilePhoto: "",
      status: "active",
      employeeId: "",  // This will be generated on the server
    },
  });

  // When department changes, filter designations
  const watchDepartmentId = form.watch("departmentId");
  
  useEffect(() => {
    if (watchDepartmentId) {
      refetchDesignations();
    }
  }, [watchDepartmentId, refetchDesignations]);

  // Filter designations based on selected department
  const filteredDesignations = designations 
    ? watchDepartmentId 
      ? designations.filter((d: any) => d.departmentId === watchDepartmentId)
      : designations
    : [];

  // Set form values when editing
  useEffect(() => {
    if (isEditing && employeeData) {
      form.reset({
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        dateOfBirth: employeeData.dateOfBirth ? new Date(employeeData.dateOfBirth).toISOString().slice(0, 10) : undefined,
        gender: employeeData.gender,
        bloodGroup: employeeData.bloodGroup,
        maritalStatus: employeeData.maritalStatus,
        email: employeeData.email,
        phoneNumber: employeeData.phoneNumber || "",
        emergencyContact: employeeData.emergencyContact || "",
        currentAddress: employeeData.currentAddress || "",
        permanentAddress: employeeData.permanentAddress || "",
        departmentId: employeeData.departmentId || null,
        designationId: employeeData.designationId || null,
        reportingManagerId: employeeData.reportingManagerId || null,
        employmentType: employeeData.employmentType || "full_time",
        joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        userId: employeeData.userId || null,
        profilePhoto: employeeData.profilePhoto || "",
        status: employeeData.status || "active",
        employeeId: employeeData.employeeId || "",
      });
    }
  }, [isEditing, employeeData, form]);

  // Form submission handler
  const onSubmit = (values: EmployeeFormValues) => {
    if (isEditing && employeeData) {
      updateEmployeeMutation.mutate({ id: employeeData.id, data: values });
    } else {
      createEmployeeMutation.mutate(values);
    }
  };

  // Function to go to next tab
  const goToNextTab = () => {
    if (activeTab === "personal") {
      setActiveTab("contact");
    } else if (activeTab === "contact") {
      setActiveTab("employment");
    }
  };

  // Function to go to previous tab
  const goToPrevTab = () => {
    if (activeTab === "employment") {
      setActiveTab("contact");
    } else if (activeTab === "contact") {
      setActiveTab("personal");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
            <TabsTrigger value="employment">Employment Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter first name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter last name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={goToNextTab}>
                Next
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address*</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter email address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter emergency contact" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="currentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter current address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="permanentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permanent Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter permanent address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={goToPrevTab}>
                Previous
              </Button>
              <Button type="button" onClick={goToNextTab}>
                Next
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="employment" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value) || null)}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((department: any) => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="designationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value) || null)}
                      value={field.value ? field.value.toString() : undefined}
                      disabled={!watchDepartmentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!watchDepartmentId ? "Select department first" : "Select designation"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredDesignations.map((designation: any) => (
                          <SelectItem key={designation.id} value={designation.id.toString()}>
                            {designation.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportingManagerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporting Manager</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value) || null)}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reporting manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.filter((emp: any) => !isEditing || emp.id !== employeeData?.id)
                          .map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="joiningDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joining Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={goToPrevTab}>
                Previous
              </Button>
              <Button 
                type="submit" 
                disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
              >
                {(createEmployeeMutation.isPending || updateEmployeeMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update Employee" : "Create Employee"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
