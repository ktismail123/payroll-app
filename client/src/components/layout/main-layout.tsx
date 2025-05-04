import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for larger screens */}
      <div className="hidden md:block md:w-64 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {/* Page header with title and subtitle */}
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-semibold text-neutral-dark">{title}</h1>}
              {subtitle && <p className="text-neutral-medium">{subtitle}</p>}
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}
