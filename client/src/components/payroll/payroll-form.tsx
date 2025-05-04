import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Trash, Loader2, AlertCircle } from "lucide-react";

// Payroll Item Schema
const payrollItemSchema = z.object({
  itemType: z.enum(["earning", "deduction"]),
  itemName: z.string().min(1, "Item name is required"),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Amount must be a positive number",
  }),
  description: z.string().optional(),
});

// Full Payroll Schema
const payrollSchema = z.object({
  employeeId: z.number().min(1, "Employee is required"),
  payPeriodStart: z.string().min(1, "Start date is required"),
  payPeriodEnd: z.string().min(1, "End date is required"),
  basicSalary: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Basic salary must be a positive number",
  }),
  items: z.array(payrollItemSchema).optional(),
});

type PayrollItemFormValues = z.infer<typeof payrollItemSchema>;
type PayrollFormValues = z.infer<typeof payrollSchema>;

interface PayrollFormProps {
  payrollData?: any;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export function PayrollForm({ payrollData, isEditing = false, onSuccess }: PayrollFormProps) {
  const { toast } = useToast();
  const [payrollItems, setPayrollItems] = useState<PayrollItemFormValues[]>([]);
  const [currentSalary, setCurrentSalary] = useState<number | null>(null);
  
  // Fetch employees for dropdown
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/employees'],
  });
  
  // Create payroll form
  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      employeeId: 0,
      payPeriodStart: new Date().toISOString().slice(0, 10),
      payPeriodEnd: new Date().toISOString().slice(0, 10),
      basicSalary: "0",
      items: [],
    },
  });
  
  // Create payroll item form
  const itemForm = useForm<PayrollItemFormValues>({
    resolver: zodResolver(payrollItemSchema),
    defaultValues: {
      itemType: "earning",
      itemName: "",
      amount: "0",
      description: "",
    },
  });

  // Fetch salary when employee changes
  const watchEmployeeId = form.watch("employeeId");
  
  useEffect(() => {
    const fetchSalary = async () => {
      if (watchEmployeeId) {
        try {
          const response = await fetch(`/api/salary-structures/current/${watchEmployeeId}`, {
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.basicSalary) {
              form.setValue("basicSalary", data.basicSalary.toString());
              setCurrentSalary(parseFloat(data.basicSalary));
            }
          }
        } catch (error) {
          console.error("Error fetching salary:", error);
        }
      }
    };
    
    fetchSalary();
  }, [watchEmployeeId, form]);

  // Create payroll mutation
  const createPayrollMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the payroll
      const payrollResponse = await apiRequest("POST", "/api/payrolls", {
        employeeId: data.employeeId,
        payPeriodStart: data.payPeriodStart,
        payPeriodEnd: data.payPeriodEnd,
        basicSalary: parseFloat(data.basicSalary),
        totalEarnings: calculateTotalEarnings(),
        totalDeductions: calculateTotalDeductions(),
        netSalary: calculateNetSalary(parseFloat(data.basicSalary)),
        status: 'draft',
      });
      
      if (!payrollResponse.ok) {
        throw new Error("Failed to create payroll");
      }
      
      // Get the created payroll
      const payroll = await payrollResponse.json();
      
      // Create payroll items
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await apiRequest("POST", "/api/payroll-items", {
            payrollId: payroll.id,
            itemType: item.itemType,
            itemName: item.itemName,
            amount: parseFloat(item.amount),
            description: item.description,
          });
        }
      }
      
      return payroll;
    },
    onSuccess: () => {
      toast({
        title: "Payroll created",
        description: "The payroll has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payrolls'] });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create payroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add payroll item
  const handleAddItem = (values: PayrollItemFormValues) => {
    setPayrollItems([...payrollItems, values]);
    itemForm.reset();
  };

  // Remove payroll item
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...payrollItems];
    updatedItems.splice(index, 1);
    setPayrollItems(updatedItems);
  };

  // Submit payroll
  const onSubmit = (values: PayrollFormValues) => {
    const formData = {
      ...values,
      items: payrollItems,
    };
    
    createPayrollMutation.mutate(formData);
  };

  // Calculate totals
  const calculateTotalEarnings = () => {
    return payrollItems
      .filter(item => item.itemType === "earning")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  };

  const calculateTotalDeductions = () => {
    return payrollItems
      .filter(item => item.itemType === "deduction")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  };

  const calculateNetSalary = (basicSalary: number) => {
    return basicSalary + calculateTotalEarnings() - calculateTotalDeductions();
  };

  const getEmployeeName = (id: number) => {
    if (!employees) return "";
    const employee = employees.find((emp: any) => emp.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : "";
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee*</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.firstName} {employee.lastName} ({employee.employeeId})
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
              name="basicSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Basic Salary*</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-medium" />
                      <Input {...field} type="number" step="0.01" min="0" className="pl-9" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Based on employee's salary structure
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="payPeriodStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay Period Start*</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="payPeriodEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay Period End*</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Additional Pay Items</h3>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Pay Item</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...itemForm}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="itemType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="earning">Earning</SelectItem>
                              <SelectItem value="deduction">Deduction</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="itemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Bonus, Tax" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount*</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-medium" />
                              <Input {...field} type="number" step="0.01" min="0" className="pl-9" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-end">
                      <Button 
                        type="button" 
                        onClick={itemForm.handleSubmit(handleAddItem)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
            
            {payrollItems.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-medium">Items</h4>
                
                <div className="space-y-2">
                  {payrollItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.itemType === "earning" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {item.itemType === "earning" ? "Earning" : "Deduction"}
                        </span>
                        <span className="font-medium">{item.itemName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>${parseFloat(item.amount).toFixed(2)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral-medium">Basic Salary:</span>
                    <span>${parseFloat(form.getValues("basicSalary") || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral-medium">Total Earnings:</span>
                    <span className="text-success">${calculateTotalEarnings().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral-medium">Total Deductions:</span>
                    <span className="text-destructive">${calculateTotalDeductions().toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Net Salary:</span>
                    <span>${calculateNetSalary(parseFloat(form.getValues("basicSalary") || "0")).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-md text-neutral-medium">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No additional pay items added yet</p>
                <p className="text-sm">The payroll will only include the basic salary</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="submit" 
              disabled={createPayrollMutation.isPending}
              className="min-w-[150px]"
            >
              {createPayrollMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Payroll"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
