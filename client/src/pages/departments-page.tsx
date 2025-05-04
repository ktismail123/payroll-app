import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Edit, Loader2, Users } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  managerId: z.number().nullable().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export default function DepartmentsPage() {
  const { toast } = useToast();
  const { checkRole } = useAuth();
  const [canEditDepartments, setCanEditDepartments] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  
  const { data: departments, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Check if user has HR access to edit departments
  useEffect(() => {
    async function checkAccess() {
      const hasAccess = await checkRole('hr_manager');
      setCanEditDepartments(hasAccess);
    }
    checkAccess();
  }, [checkRole]);

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormValues) => {
      return await apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      toast({
        title: "Department created",
        description: "The department has been created successfully.",
      });
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: DepartmentFormValues }) => {
      return await apiRequest("PUT", `/api/departments/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Department updated",
        description: "The department has been updated successfully.",
      });
      refetch();
      setEditingDepartment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: null,
    },
  });

  const editForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: null,
    },
  });

  // Reset form when opening the dialog
  useEffect(() => {
    if (isAddDialogOpen) {
      addForm.reset();
    }
  }, [isAddDialogOpen, addForm]);

  // Set form values when editing
  useEffect(() => {
    if (editingDepartment) {
      editForm.reset({
        name: editingDepartment.name,
        description: editingDepartment.description || "",
        managerId: editingDepartment.managerId,
      });
    }
  }, [editingDepartment, editForm]);

  const onAddSubmit = (data: DepartmentFormValues) => {
    createDepartmentMutation.mutate(data);
  };

  const onEditSubmit = (data: DepartmentFormValues) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, data });
    }
  };

  // Get employee count for department
  const getEmployeeCount = async (departmentId: number) => {
    try {
      const response = await fetch(`/api/employees?departmentId=${departmentId}`, {
        credentials: "include",
      });
      if (!response.ok) return "N/A";
      const data = await response.json();
      return data.length;
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <MainLayout title="Departments" subtitle="Manage company departments">
      <Breadcrumb items={[{ label: "Departments" }]} />
      
      {canEditDepartments && (
        <div className="mb-6 flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter department name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter department description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createDepartmentMutation.isPending}
                    >
                      {createDepartmentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Department"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter department name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter department description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingDepartment(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateDepartmentMutation.isPending}
                    >
                      {updateDepartmentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Department"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Departments List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">
              Failed to load departments
            </div>
          ) : departments && departments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Employees</TableHead>
                  {canEditDepartments && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department: any) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.description || "N/A"}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-neutral-medium" />
                      {department.employeeCount || "0"}
                    </TableCell>
                    {canEditDepartments && (
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingDepartment(department)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-neutral-medium">
              No departments found. {canEditDepartments && "Add a department to get started."}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
