import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Target, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";

export default function StudentDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: attempts } = useQuery({
    queryKey: ["my-attempts"],
    queryFn: async () => {
      const data = await apiFetch("/attempts");
      return data || [];
    },
    enabled: !!user,
  });

  // Fixed count for the 3 available subjects (C, Python, Java)
  const quizCount = 3;

  const completedAttempts = attempts?.filter((a: any) => a.completedAt) || [];
  const avgScore = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum: number, a: any) => sum + (Number(a.percentage) || 0), 0) / completedAttempts.length)
    : 0;
  const bestScore = completedAttempts.length
    ? Math.round(Math.max(...completedAttempts.map((a: any) => Number(a.percentage) || 0)))
    : 0;

  const stats = [
    { label: "Available Quizzes", value: quizCount || 0, icon: BookOpen, color: "text-secondary" },
    { label: "Tests Taken", value: completedAttempts.length, icon: Trophy, color: "text-accent" },
    { label: "Average Score", value: `${avgScore}%`, icon: Target, color: "text-success" },
    { label: "Best Score", value: `${bestScore}%`, icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "Manage quizzes and monitor performance" : "Track your progress and take assessments"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="card-hover border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-xl bg-muted p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-foreground">Recent Activity</h2>
            <Link to="/subjects" className="text-sm font-medium text-secondary hover:underline">
              Take Quizzes →
            </Link>
          </div>
          {completedAttempts.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-heading text-lg font-semibold text-foreground">No assessments yet</h3>
                <p className="mt-1 text-muted-foreground">Start a quiz to see your results here</p>
                <Link to="/subjects">
                  <button className="mt-4 gradient-primary rounded-lg px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                    Take Quizzes
                  </button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedAttempts.slice(0, 5).map((attempt: any, i: number) => (
                <Card key={attempt._id} className="card-hover border-border" style={{ animationDelay: `${i * 100}ms` }}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {attempt.quizId?.title || "Quiz"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.completedAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold font-heading text-foreground">
                        {Math.round(Number(attempt.percentage))}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {attempt.score}/{attempt.totalPoints} pts
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
