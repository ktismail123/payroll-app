import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  action?: {
    label: string;
    href: string;
  };
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  trend,
  action,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={cn("p-3 rounded-full mr-4", iconBgColor)}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-neutral-medium">{title}</p>
            <p className="text-2xl font-semibold text-neutral-dark">{value}</p>
          </div>
        </div>
        
        {(trend || action) && (
          <div className="mt-4 flex items-center justify-between">
            {trend && (
              <span className={cn(
                "text-sm flex items-center",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                {trend.value}%
                <span className="text-neutral-medium ml-2">{trend.label}</span>
              </span>
            )}
            
            {action && (
              <a href={action.href} className="text-sm text-primary ml-2 hover:underline">
                {action.label}
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
