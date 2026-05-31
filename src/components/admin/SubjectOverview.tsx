import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, BookOpen, Layers, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SubjectStat {
  subject: string;
  totalQuestions: number;
  banksCount: number;
  attemptsCount: number;
}

export default function SubjectOverview() {
  const { data: stats, isLoading } = useQuery<SubjectStat[]>({
    queryKey: ["admin-subject-stats"],
    queryFn: async () => {
      const resp = await apiFetch("/admin/subjects/stats");
      return resp;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {stats?.map((stat) => (
          <Card key={stat.subject} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold">{stat.subject}</CardTitle>
                <CardDescription>Subject Overview</CardDescription>
              </div>
              <div className={`p-3 rounded-full ${
                stat.subject === 'C' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' :
                stat.subject === 'Python' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400' :
                'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                <BookOpen className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    <span>Question Banks</span>
                  </div>
                  <span className="font-semibold">{stat.banksCount} Banks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Total Questions</span>
                  </div>
                  <span className="font-semibold">{stat.totalQuestions} Questions</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart className="h-4 w-4" />
                    <span>Student Attempts</span>
                  </div>
                  <span className="font-semibold">{stat.attemptsCount} Quizzes Taken</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
