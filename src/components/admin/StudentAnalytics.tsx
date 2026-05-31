import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalStudents: number;
  totalQuestions: number;
  totalAttempts: number;
  totalQuizzes: number;
}

export default function StudentAnalytics() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-general-stats"],
    queryFn: async () => {
      const resp = await apiFetch("/admin/dashboard/stats");
      return resp;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Registered Students
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-heading">{stats?.totalStudents || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Total platform users with student roles</p>
        </CardContent>
      </Card>
      
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Assessments Completed
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-heading">{stats?.totalAttempts || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Total quiz attempts across all subjects</p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Platform Content
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-heading">
            {stats?.totalQuestions || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Questions stored in the database
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
