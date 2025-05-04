import { useState } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Eye, Check, DollarSign, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatter } from "@/lib/utils";

interface PayrollListProps {
  payrolls: any[];
  isLoading: boolean;
  error: Error | null;
  status: string;
  canApprove: boolean;
  onStatusChange: () => void;
}

export function PayrollList({ 
  payrolls, 
  isLoading, 
  error, 
  status = 'pending',
  canApprove = false,
  onStatusChange
}: PayrollListProps) {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Approve payroll mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      setProcessingId(id);
      return await apiRequest("POST", `/api/payrolls/${id}/approve`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Payroll approved",
        description: "The payroll has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payrolls'] });
      setProcessingId(null);
      if (onStatusChange) {
        onStatusChange();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve payroll",
        description: error.message,
        variant: "destructive",
      });
      setProcessingId(null);
    },
  });
  
  // Mark payroll as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      setProcessingId(id);
      return await apiRequest("POST", `/api/payrolls/${id}/mark-paid`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Payroll marked as paid",
        description: "The payroll has been marked as paid successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payrolls'] });
      setProcessingId(null);
      if (onStatusChange) {
        onStatusChange();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark payroll as paid",
        description: error.message,
        variant: "destructive",
      });
      setProcessingId(null);
    },
  });

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
          <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load payrolls</h3>
          <p className="text-neutral-medium max-w-md">
            {error.message || "An error occurred while fetching payroll data. Please try again later."}
          </p>
        </CardContent>
      </Card>
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

  // Make sure payrolls is an array before filtering
  const payrollsToShow = Array.isArray(payrolls) ? payrolls.filter(payroll => 
    status === 'pending' ? payroll.status === 'draft' : 
    status === 'approved' ? payroll.status === 'approved' : 
    payroll.status === 'paid'
  ) : [];

  return (
    <Card>
      <CardContent className="p-0">
        {payrollsToShow.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Process Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollsToShow.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">#{payroll.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div>
                          <div>Employee #{payroll.employeeId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(payroll.payPeriodStart), 'MMM dd')} - {format(new Date(payroll.payPeriodEnd), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{formatter.format(Number(payroll.netSalary))}</TableCell>
                    <TableCell>{format(new Date(payroll.processDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
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
                          <Link href={`/payroll/${payroll.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          
                          {payroll.status === 'draft' && canApprove && (
                            <DropdownMenuItem 
                              onClick={() => approveMutation.mutate(payroll.id)}
                              disabled={processingId === payroll.id}
                            >
                              {processingId === payroll.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          
                          {payroll.status === 'approved' && canApprove && (
                            <DropdownMenuItem 
                              onClick={() => markAsPaidMutation.mutate(payroll.id)}
                              disabled={processingId === payroll.id}
                            >
                              {processingId === payroll.id ? (
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
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-neutral-medium mb-2" />
            <h3 className="text-lg font-semibold mb-1">No Payrolls Found</h3>
            <p className="text-neutral-medium max-w-md">
              {status === 'pending' 
                ? "There are no pending payrolls that need approval." 
                : status === 'approved'
                ? "There are no approved payrolls waiting to be paid."
                : "There are no paid payrolls in the system."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
