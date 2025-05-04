import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import {
  Home,
  Users,
  DollarSign,
  Building2,
  BadgeCheck,
  BarChart3,
  FileText,
  Settings,
  UserCog,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHRManager, setIsHRManager] = useState(false);
  const { checkRole } = useAuth();

  useEffect(() => {
    const checkUserRoles = async () => {
      if (user) {
        setIsAdmin(await checkRole("administrator"));
        setIsHRManager(await checkRole("hr_manager"));
      }
    };

    checkUserRoles();
  }, [user, checkRole]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200",
        className,
      )}
    >
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <Link href="/">
          <h1 className="text-xl font-semibold text-primary cursor-pointer">
            EPMS
          </h1>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="mb-4">
          <span className="px-3 text-xs font-semibold text-neutral-medium uppercase tracking-wider">
            Main
          </span>
          <nav className="mt-2 space-y-1">
            <Link href="/">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location === "/" &&
                    "bg-primary/10 text-primary border-l-4 border-primary pl-3",
                )}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/employees">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location.startsWith("/employees") &&
                    "bg-primary/10 text-primary border-l-4 border-primary pl-3",
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                Employees
              </Button>
            </Link>
            <Link href="/payroll">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location.startsWith("/payroll") &&
                    "bg-primary/10 text-primary border-l-4 border-primary pl-3",
                )}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Payroll
              </Button>
            </Link>
            <Link href="/departments">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location === "/departments" &&
                    "bg-primary/10 text-primary border-l-4 border-primary pl-3",
                )}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Departments
              </Button>
            </Link>
            <Link href="/designations">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location === "/designations" &&
                    "bg-primary/10 text-primary border-l-4 border-primary pl-3",
                )}
              >
                <BadgeCheck className="mr-2 h-4 w-4" />
                Designations
              </Button>
            </Link>
          </nav>
        </div>

        {/* {(isAdmin || isHRManager) && (
          <div className="mb-4">
            <span className="px-3 text-xs font-semibold text-neutral-medium uppercase tracking-wider">
              Reports
            </span>
            <nav className="mt-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Employee Reports
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Payroll Reports
              </Button>
            </nav>
          </div>
        )} */}

        {/* {isAdmin && (
          <div className="mb-4">
            <span className="px-3 text-xs font-semibold text-neutral-medium uppercase tracking-wider">
              Settings
            </span>
            <nav className="mt-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <UserCog className="mr-2 h-4 w-4" />
                User Management
              </Button>
            </nav>
          </div>
        )} */}
      </ScrollArea>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={user?.username || ""} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-dark">
              {user?.username}
            </p>
            <p className="text-xs text-neutral-medium capitalize">
              {user?.role.replace("_", " ")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="mt-3 w-full"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <div className="flex items-center">
              <span className="animate-spin mr-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              </span>
              Signing Out...
            </div>
          ) : (
            <div className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
