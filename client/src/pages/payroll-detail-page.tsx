import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  Printer, 
  FileDown, 
  AlertCircle, 
  Loader2, 
  AlertTriangle,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatter } from "@/lib/utils";

export default function PayrollDetailPage() {
  const { id } = useParams();
  const { checkRole } = useAuth();
  const { toast } = useToast();
  const [canApprovePayroll, setCanApprovePayroll] = useState(false);
  
  // Fetch payroll details
  const { 
    data: payroll, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [`/api/payrolls/${id}`],
  });

  // Fetch employee details
  const { data: employee } = useQuery({
    queryKey: [`/api/employees/${payroll?.employeeId}`],
    enabled: !!payroll?.employeeId,
  });

  // Approve payroll mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/payrolls/${id}/approve`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Payroll approved",
        description: "The payroll has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/payrolls/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve payroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/payrolls/${id}/mark-paid`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Payroll marked as paid",
        description: "The payroll has been marked as paid successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/payrolls/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark payroll as paid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user has role to approve payrolls
  useEffect(() => {
    async function checkAccess() {
      const hasAccess = await checkRole('hr_manager');
      setCanApprovePayroll(hasAccess);
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

  if (error || !payroll) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold">Payroll Not Found</h2>
          <p className="text-neutral-medium mt-1">
            The payroll record you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </MainLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Approved</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <Breadcrumb 
        items={[
          { label: "Payroll", href: "/payroll" },
          { label: `Payroll #${payroll.id}` }
        ]} 
      />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">
            Payroll #{payroll.id}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-neutral-medium">
              {employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payroll.employeeId}`}
            </span>
            <span className="text-neutral-medium mx-1">•</span>
            <span className="text-neutral-medium">
              {format(new Date(payroll.processDate), 'MMMM yyyy')}
            </span>
            {getStatusBadge(payroll.status)}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
      
      {payroll.status === 'draft' && canApprovePayroll && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Approval Required</AlertTitle>
          <AlertDescription>
            This payroll is pending approval. Review the details and approve if everything looks correct.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-success" />
                Payroll Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-neutral-medium" />
                    Pay Period
                  </h3>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-neutral-medium">Start: </span>
                      <span>
                        {format(new Date(payroll.payPeriodStart), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-medium">End: </span>
                      <span>
                        {format(new Date(payroll.payPeriodEnd), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-neutral-medium" />
                    Employee Information
                  </h3>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-neutral-medium">Name: </span>
                      <span>
                        {employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payroll.employeeId}`}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-medium">ID: </span>
                      <span>
                        {employee?.employeeId || `#${payroll.employeeId}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-neutral-medium" />
                    Processing Information
                  </h3>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-neutral-medium">Date: </span>
                      <span>
                        {format(new Date(payroll.processDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-medium">Status: </span>
                      <span className="capitalize">
                        {payroll.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {payroll.status !== 'draft' && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-neutral-medium" />
                      Approval Details
                    </h3>
                    <div className="space-y-1">
                      {payroll.approvedBy && (
                        <div className="text-sm">
                          <span className="text-neutral-medium">Approved By: </span>
                          <span>ID #{payroll.approvedBy}</span>
                        </div>
                      )}
                      {payroll.approvalDate && (
                        <div className="text-sm">
                          <span className="text-neutral-medium">Date: </span>
                          <span>
                            {format(new Date(payroll.approvalDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <h3 className="text-base font-medium mb-4">Payroll Breakdown</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Basic Salary</span>
                      <span className="text-sm font-medium">
                        {formatter.format(Number(payroll.basicSalary))}
                      </span>
                    </div>
                    
                    {payroll.items && payroll.items
                      .filter((item: any) => item.itemType === 'earning')
                      .map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center py-1">
                          <span className="text-sm">{item.itemName}</span>
                          <span className="text-sm font-medium">
                            {formatter.format(Number(item.amount))}
                          </span>
                        </div>
                      ))
                    }
                    
                    <div className="flex justify-between items-center py-1 font-medium">
                      <span className="text-sm">Total Earnings</span>
                      <span className="text-sm">
                        {formatter.format(Number(payroll.totalEarnings))}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Deductions</h4>
                  <div className="space-y-2">
                    {payroll.items && payroll.items
                      .filter((item: any) => item.itemType === 'deduction')
                      .map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center py-1">
                          <span className="text-sm">{item.itemName}</span>
                          <span className="text-sm font-medium">
                            {formatter.format(Number(item.amount))}
                          </span>
                        </div>
                      ))
                    }
                    
                    <div className="flex justify-between items-center py-1 font-medium">
                      <span className="text-sm">Total Deductions</span>
                      <span className="text-sm">
                        {formatter.format(Number(payroll.totalDeductions))}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2 font-semibold">
                  <span>Net Salary</span>
                  <span className="text-lg text-success">
                    {formatter.format(Number(payroll.netSalary))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payroll.status === 'draft' && canApprovePayroll && (
                <Button 
                  className="w-full" 
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve Payroll
                    </>
                  )}
                </Button>
              )}
              
              {payroll.status === 'approved' && canApprovePayroll && (
                <Button 
                  className="w-full" 
                  onClick={() => markAsPaidMutation.mutate()}
                  disabled={markAsPaidMutation.isPending}
                >
                  {markAsPaidMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </>
                  )}
                </Button>
              )}
              
              <Button variant="outline" className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Print Payslip
              </Button>
              
              <Button variant="outline" className="w-full">
                <FileDown className="h-4 w-4 mr-2" />
                Download as PDF
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-medium">
              <p>
                This payslip is computer generated and does not require signature.
                For any discrepancies, please contact the HR department.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
