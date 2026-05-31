import { useAuth } from "@/hooks/useAuth";
import { Link, Navigate } from "react-router-dom";
import { BookOpen, BarChart3, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    if (user.role === "admin") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }

  const features = [
    { icon: BookOpen, title: "Take Assessments", desc: "Test your knowledge with curated quizzes across multiple domains" },
    { icon: BarChart3, title: "Track Progress", desc: "View detailed analytics and performance trends over time" },
    { icon: Shield, title: "Instant Results", desc: "Get auto-evaluated scores and detailed breakdowns immediately" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-lg">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">QuizVault</span>
        </div>
        <Link to="/auth">
          <Button variant="outline" size="sm">Sign In</Button>
        </Link>
      </header>

      <section className="container py-20 text-center md:py-32">
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-bold leading-tight text-foreground md:text-6xl">
          Assess Knowledge.{" "}
          <span className="text-gradient">Track Growth.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          A modern assessment platform for creating quizzes, evaluating performance, and gaining actionable insights — all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/auth">
            <Button size="lg" className="gradient-primary border-0 text-primary-foreground">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="card-hover rounded-xl border border-border bg-card p-8 animate-fade-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} QuizVault. Built with ❤️</p>
      </footer>
    </div>
  );
}
