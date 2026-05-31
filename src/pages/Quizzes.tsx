import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

export default function Quizzes() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["published-quizzes"],
    queryFn: async () => {
      const data = await apiFetch("/quizzes");
      return data || [];
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Available Quizzes</h1>
          <p className="mt-1 text-muted-foreground">Choose an assessment to test your knowledge</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-border">
                <CardContent className="p-6">
                  <div className="h-6 w-3/4 rounded bg-muted" />
                  <div className="mt-3 h-4 w-full rounded bg-muted" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quizzes?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="font-heading text-lg font-semibold">No quizzes available</h3>
              <p className="text-muted-foreground">Check back later for new assessments</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes?.map((quiz: any, i: number) => (
              <Link key={quiz._id} to={`/quiz/${quiz._id}`}>
                <Card
                  className="card-hover cursor-pointer border-border animate-fade-in h-full"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-heading text-lg leading-tight">{quiz.title}</CardTitle>
                      {quiz.category && (
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          {quiz.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {quiz.description && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-4 w-4" />
                        {quiz.questions?.length || 0} questions
                      </span>
                      {quiz.timeLimitMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {quiz.timeLimitMinutes} min
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
