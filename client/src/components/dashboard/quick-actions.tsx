import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserPlus, DollarSign, FileText, CheckCircle, Clock, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export function QuickActions() {
  const { checkRole } = useAuth();
  const [hasHRAccess, setHasHRAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const hasAccess = await checkRole('hr_staff');
      setHasHRAccess(hasAccess);
    };
    
    checkAccess();
  }, [checkRole]);

  const { data: pendingPayrolls } = useQuery<any[]>({
    queryKey: ['/api/payrolls/pending'],
    enabled: hasHRAccess,
  });

  return (
    <Card className="h-full">
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {hasHRAccess && (
            <>
              <Link href="/employees/add">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Add Employee</span>
                </Button>
              </Link>
              <Link href="/payroll">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">Process Payroll</span>
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">Generate Report</span>
              </Button>
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-info" />
                <span className="text-sm font-medium">Approvals</span>
              </Button>
            </>
          )}
          {!hasHRAccess && (
            <>
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">View Payslips</span>
              </Button>
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                <ClipboardList className="h-5 w-5 text-info" />
                <span className="text-sm font-medium">My Documents</span>
              </Button>
            </>
          )}
        </div>
        
        {hasHRAccess && pendingPayrolls && pendingPayrolls.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-neutral-dark mb-3">Pending Tasks</h3>
            <ul className="space-y-2">
              {pendingPayrolls.slice(0, 3).map((payroll) => (
                <li key={payroll.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="text-warning h-4 w-4 mr-2" />
                    <span className="text-sm text-neutral-dark">
                      Approve Payroll #{payroll.id}
                    </span>
                  </div>
                  <span className="text-xs bg-warning text-white px-2 py-1 rounded-full">Pending</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
