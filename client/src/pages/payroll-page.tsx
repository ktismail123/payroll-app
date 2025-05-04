import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { PayrollList } from "@/components/payroll/payroll-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PayrollForm } from "@/components/payroll/payroll-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function PayrollPage() {
  const { checkRole } = useAuth();
  const [canProcessPayroll, setCanProcessPayroll] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  
  // Fetch payroll data based on active tab
  const { data: payrollData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/payrolls', { status: activeTab }],
  });

  // Check if user has HR access to add payrolls
  useEffect(() => {
    async function checkAccess() {
      const hasAccess = await checkRole('hr_manager');
      setCanProcessPayroll(hasAccess);
    }
    checkAccess();
  }, [checkRole]);

  const handlePayrollSuccess = () => {
    setIsProcessDialogOpen(false);
    refetch();
  };

  return (
    <MainLayout title="Payroll Management" subtitle="Process and manage employee payroll">
      <Breadcrumb items={[{ label: "Payroll" }]} />
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          
          {canProcessPayroll && (
            <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Process Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Process New Payroll</DialogTitle>
                </DialogHeader>
                <PayrollForm onSuccess={handlePayrollSuccess} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      <TabsContent value={activeTab} forceMount className="mt-0">
        <PayrollList 
          payrolls={payrollData || []} 
          isLoading={isLoading} 
          error={error}
          status={activeTab}
          canApprove={canProcessPayroll}
          onStatusChange={refetch}
        />
      </TabsContent>
    </MainLayout>
  );
}
