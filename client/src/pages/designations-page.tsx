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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Edit, Loader2, Building } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const designationSchema = z.object({
  title: z.string().min(1, "Designation title is required"),
  description: z.string().optional(),
  grade: z.string().optional(),
  departmentId: z.number().min(1, "Department is required"),
});

type DesignationFormValues = z.infer<typeof designationSchema>;

export default function DesignationsPage() {
  const { toast } = useToast();
  const { checkRole } = useAuth();
  const [canEditDesignations, setCanEditDesignations] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<any>(null);
  
  const { data: designations, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/designations'],
  });

  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Check if user has HR access to edit designations
  useEffect(() => {
    async function checkAccess() {
      const hasAccess = await checkRole('hr_manager');
      setCanEditDesignations(hasAccess);
    }
    checkAccess();
  }, [checkRole]);

  // Create designation mutation
  const createDesignationMutation = useMutation({
    mutationFn: async (data: DesignationFormValues) => {
      return await apiRequest("POST", "/api/designations", data);
    },
    onSuccess: () => {
      toast({
        title: "Designation created",
        description: "The designation has been created successfully.",
      });
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create designation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update designation mutation
  const updateDesignationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: DesignationFormValues }) => {
      return await apiRequest("PUT", `/api/designations/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Designation updated",
        description: "The designation has been updated successfully.",
      });
      refetch();
      setEditingDesignation(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update designation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addForm = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: {
      title: "",
      description: "",
      grade: "",
      departmentId: 0,
    },
  });

  const editForm = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: {
      title: "",
      description: "",
      grade: "",
      departmentId: 0,
    },
  });

  // Reset form when opening the dialog
  useEffect(() => {
    if (isAddDialogOpen) {
      addForm.reset({
        title: "",
        description: "",
        grade: "",
        departmentId: 0,
      });
    }
  }, [isAddDialogOpen, addForm]);

  // Set form values when editing
  useEffect(() => {
    if (editingDesignation) {
      editForm.reset({
        title: editingDesignation.title,
        description: editingDesignation.description || "",
        grade: editingDesignation.grade || "",
        departmentId: editingDesignation.departmentId,
      });
    }
  }, [editingDesignation, editForm]);

  const onAddSubmit = (data: DesignationFormValues) => {
    createDesignationMutation.mutate(data);
  };

  const onEditSubmit = (data: DesignationFormValues) => {
    if (editingDesignation) {
      updateDesignationMutation.mutate({ id: editingDesignation.id, data });
    }
  };

  const getDepartmentName = (departmentId: number) => {
    if (!departments) return "Unknown";
    const department = departments.find((dept: any) => dept.id === departmentId);
    return department ? department.name : "Unknown";
  };

  return (
    <MainLayout title="Designations" subtitle="Manage job titles and positions">
      <Breadcrumb items={[{ label: "Designations" }]} />
      
      {canEditDesignations && (
        <div className="mb-6 flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Designation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Designation</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation Title*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter designation title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department*</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments?.map((department: any) => (
                              <SelectItem 
                                key={department.id} 
                                value={department.id.toString()}
                              >
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
                    control={addForm.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter grade (e.g., Junior, Senior)" />
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
                          <Textarea {...field} placeholder="Enter designation description" />
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
                      disabled={createDesignationMutation.isPending}
                    >
                      {createDesignationMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Designation"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={!!editingDesignation} onOpenChange={(open) => !open && setEditingDesignation(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Designation</DialogTitle>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation Title*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter designation title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department*</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments?.map((department: any) => (
                              <SelectItem 
                                key={department.id} 
                                value={department.id.toString()}
                              >
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
                    control={editForm.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter grade (e.g., Junior, Senior)" />
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
                          <Textarea {...field} placeholder="Enter designation description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingDesignation(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateDesignationMutation.isPending}
                    >
                      {updateDesignationMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Designation"
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
          <CardTitle>Designations List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">
              Failed to load designations
            </div>
          ) : designations && designations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Description</TableHead>
                  {canEditDesignations && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {designations.map((designation: any) => (
                  <TableRow key={designation.id}>
                    <TableCell className="font-medium">{designation.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1 text-neutral-medium" />
                        {getDepartmentName(designation.departmentId)}
                      </div>
                    </TableCell>
                    <TableCell>{designation.grade || "N/A"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {designation.description || "N/A"}
                    </TableCell>
                    {canEditDesignations && (
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingDesignation(designation)}
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
              No designations found. {canEditDesignations && "Add a designation to get started."}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
