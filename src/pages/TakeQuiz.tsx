import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useProctor } from "@/hooks/useProctor";
import ProctoringOverlay from "@/components/ProctoringOverlay";

export default function TakeQuiz() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ── Proctoring ────────────────────────────────────────────
  const [examStarted, setExamStarted] = useState(false);

  const proctor = useProctor({
    maxViolations: 3,
    onAutoSubmit: () => {
      toast.error("Exam auto-submitted due to multiple violations.");
      if (!submitted) submitMutation.mutate();
    },
    enabled: examStarted && !submitted,
  });

  const startExam = () => {
    setExamStarted(true);
    proctor.enterFullscreen();
  };

  const { data: quiz } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const data = await apiFetch(`/quizzes/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: questions } = useQuery({
    queryKey: ["quiz-questions", id],
    queryFn: async () => {
      const data = await apiFetch(`/quizzes/${id}/questions`);
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (quiz?.timeLimitMinutes && !submitted) {
      setTimeLeft(quiz.timeLimitMinutes * 60);
    }
  }, [quiz, submitted]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!questions || !user) return;
      let score = 0;
      const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
      const answerData = questions.map((q: any) => {
        const userAnswer = answers[q._id] || "";
        const isCorrect = userAnswer === q.correctAnswer;
        if (isCorrect) score += (q.points || 1);
        return { questionId: q._id, answer: userAnswer, isCorrect };
      });
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

      await apiFetch("/attempts", {
        method: "POST",
        body: JSON.stringify({
          quizId: id!,
          score,
          totalPoints,
          percentage,
          completedAt: new Date().toISOString(),
          answers: answerData,
        }),
      });

      return { score, total: totalPoints, percentage };
    },
    onSuccess: (data) => {
      if (data) {
        setResult(data);
        setSubmitted(true);
        toast.success("Quiz submitted successfully!");
      }
    },
  });

  const handleSubmit = () => {
    if (!submitted) submitMutation.mutate();
  };

  if (!quiz || !questions) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (submitted && result) {
    const passed = result.percentage >= 50;
    return (
      <Layout>
        <div className="mx-auto max-w-lg animate-fade-in">
          <Card className="border-border text-center">
            <CardContent className="py-12">
              <div
                className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
                  passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}
              >
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {passed ? "Great job!" : "Keep practicing!"}
              </h2>
              <p className="mt-2 text-muted-foreground">{quiz.title}</p>
              <div className="mt-6 text-5xl font-bold font-heading text-foreground">
                {Math.round(result.percentage)}%
              </div>
              <p className="mt-2 text-muted-foreground">
                {result.score} out of {result.total} points
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button variant="outline" onClick={() => navigate("/quizzes")}>
                  Browse More
                </Button>
                <Button onClick={() => navigate("/analytics")}>View Analytics</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const question = questions[currentQ];
  const options = Array.isArray(question.options) ? question.options as string[] : [];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <Layout>
      {/* ── Proctoring UI layer ── */}
      <ProctoringOverlay
        examStarted={examStarted}
        examOver={proctor.examOver}
        isExamBlocked={proctor.isExamBlocked}
        violations={proctor.violations}
        maxViolations={proctor.maxViolations}
        warningModal={proctor.warningModal}
        toastQueue={proctor.toastQueue}
        onStartExam={startExam}
        onCloseModal={proctor.closeWarningModal}
        onReEnterFullscreen={proctor.reEnterFullscreen}
      />
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQ + 1} of {questions.length}
            </p>
          </div>
          {timeLeft !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-warning" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        <Card className="border-border animate-fade-in" key={question._id}>
          <CardHeader>
            <CardTitle className="font-heading text-lg leading-relaxed">
              {question.questionText}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{question.points || 1} point{(question.points || 1) > 1 ? "s" : ""}</p>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[question._id] || ""}
              onValueChange={(val) => !proctor.isExamBlocked && setAnswers((prev) => ({ ...prev, [question._id]: val }))}
              style={{ opacity: proctor.isExamBlocked ? 0.35 : 1, pointerEvents: proctor.isExamBlocked ? 'none' : 'auto', transition: 'opacity 0.3s ease' }}
            >
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <Label
                    key={i}
                    htmlFor={`opt-${i}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      answers[question._id] === String(opt)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value={String(opt)} id={`opt-${i}`} disabled={proctor.isExamBlocked} />
                    <span className="text-foreground">{String(opt)}</span>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQ((p) => p - 1)}
            disabled={currentQ === 0 || proctor.isExamBlocked}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ((p) => p + 1)} disabled={proctor.isExamBlocked}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitMutation.isPending || proctor.isExamBlocked} className="gradient-primary border-0 text-primary-foreground">
              {proctor.isExamBlocked ? "⏸ Paused" : "Submit Quiz"}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
