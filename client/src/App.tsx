import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import EmployeesPage from "@/pages/employees-page";
import EmployeeDetailPage from "@/pages/employee-detail-page";
import AddEmployeePage from "@/pages/add-employee-page";
import PayrollPage from "@/pages/payroll-page";
import PayrollDetailPage from "@/pages/payroll-detail-page";
import DepartmentsPage from "@/pages/departments-page";
import DesignationsPage from "@/pages/designations-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/employees" component={EmployeesPage} />
      <ProtectedRoute path="/employees/add" component={AddEmployeePage} />
      <ProtectedRoute path="/employees/:id" component={EmployeeDetailPage} />
      <ProtectedRoute path="/payroll" component={PayrollPage} />
      <ProtectedRoute path="/payroll/:id" component={PayrollDetailPage} />
      <ProtectedRoute path="/departments" component={DepartmentsPage} />
      <ProtectedRoute path="/designations" component={DesignationsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
