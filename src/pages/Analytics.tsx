import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import Layout from "@/components/Layout";

const COLORS = ["hsl(174, 60%, 40%)", "hsl(220, 70%, 25%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(152, 60%, 40%)"];

export default function Analytics() {
  const { user, isAdmin } = useAuth();

  const { data: attempts } = useQuery({
    queryKey: ["analytics-attempts", isAdmin],
    queryFn: async () => {
      const data = await apiFetch("/attempts");
      return data || [];
    },
    enabled: !!user,
  });

  const completedAttempts = attempts || [];

  const scoreOverTime = completedAttempts.map((a: any) => ({
    date: new Date(a.completedAt!).toLocaleDateString(),
    score: Math.round(Number(a.percentage) || 0),
    quiz: a.quizId?.title || "Quiz",
  }));

  const quizScores: Record<string, number[]> = {};
  completedAttempts.forEach((a: any) => {
    const title = a.quizId?.title || "Unknown";
    if (!quizScores[title]) quizScores[title] = [];
    quizScores[title].push(Number(a.percentage) || 0);
  });
  const avgByQuiz = Object.entries(quizScores).map(([name, scores]) => ({
    name: name.length > 15 ? name.slice(0, 15) + "…" : name,
    average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  const scoreDist = [
    { range: "0-25%", count: completedAttempts.filter((a) => Number(a.percentage) <= 25).length },
    { range: "26-50%", count: completedAttempts.filter((a) => Number(a.percentage) > 25 && Number(a.percentage) <= 50).length },
    { range: "51-75%", count: completedAttempts.filter((a) => Number(a.percentage) > 50 && Number(a.percentage) <= 75).length },
    { range: "76-100%", count: completedAttempts.filter((a) => Number(a.percentage) > 75).length },
  ].filter((d) => d.count > 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {isAdmin ? "Performance Analytics" : "Your Performance"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "Overview of all assessment results" : "Track your assessment progress over time"}
          </p>
        </div>

        {completedAttempts.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No completed assessments yet. Take a quiz to see analytics!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-heading">Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="date" fontSize={12} stroke="hsl(220, 10%, 45%)" />
                    <YAxis domain={[0, 100]} fontSize={12} stroke="hsl(220, 10%, 45%)" />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220, 15%, 88%)" }}
                      formatter={(value: number) => [`${value}%`, "Score"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(174, 60%, 40%)" strokeWidth={2} dot={{ fill: "hsl(174, 60%, 40%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-heading">Average by Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgByQuiz}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="name" fontSize={12} stroke="hsl(220, 10%, 45%)" />
                    <YAxis domain={[0, 100]} fontSize={12} stroke="hsl(220, 10%, 45%)" />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220, 15%, 88%)" }} />
                    <Bar dataKey="average" fill="hsl(220, 70%, 25%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-heading">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={scoreDist} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={100} label>
                      {scoreDist.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
