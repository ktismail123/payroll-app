import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserPlus, DollarSign, FileEdit, UserCheck, UserMinus } from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

interface Activity {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  timestamp: string;
}

export function RecentActivity() {
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ['/api/audit-logs?limit=5'],
  });

  const getActivityIcon = (action: string, entityType: string) => {
    if (action === 'create' && entityType === 'employee') {
      return <UserPlus className="text-primary" />;
    } else if (action === 'create' && entityType === 'payroll') {
      return <DollarSign className="text-success" />;
    } else if (action === 'update') {
      return <FileEdit className="text-purple-600" />;
    } else if (action === 'approve') {
      return <UserCheck className="text-warning" />;
    } else if (action === 'delete') {
      return <UserMinus className="text-error" />;
    } else {
      return <FileEdit className="text-info" />;
    }
  };

  const getActivityIconBg = (action: string, entityType: string) => {
    if (action === 'create' && entityType === 'employee') {
      return 'bg-blue-100';
    } else if (action === 'create' && entityType === 'payroll') {
      return 'bg-green-100';
    } else if (action === 'update') {
      return 'bg-purple-100';
    } else if (action === 'approve') {
      return 'bg-yellow-100';
    } else if (action === 'delete') {
      return 'bg-red-100';
    } else {
      return 'bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return `${format(date, 'MMM d, yyyy')} at ${format(date, 'h:mm a')}`;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <a href="#" className="text-sm text-primary hover:underline">View all</a>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">
            Failed to load activities
          </div>
        ) : activities && activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-start">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getActivityIconBg(activity.action, activity.entityType)} flex items-center justify-center mr-3`}>
                  {getActivityIcon(activity.action, activity.entityType)}
                </div>
                <div>
                  <p className="text-sm text-neutral-dark">
                    {activity.details}
                  </p>
                  <p className="text-xs text-neutral-medium mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-neutral-medium">
            No recent activities
          </div>
        )}
      </CardContent>
    </Card>
  );
}
