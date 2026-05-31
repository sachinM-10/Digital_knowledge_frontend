import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiFetch, API_URL } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useProctor } from "@/hooks/useProctor";
import ProctoringOverlay from "@/components/ProctoringOverlay";
import FeedbackForm from "@/components/FeedbackForm";

interface Question {
  _id: string;
  subject: string;
  question: string;
  options: string[];
}

export default function SubjectQuiz() {
  const { subject } = useParams<{ subject: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────
  // Stable refs — event listeners always read these, never stale closures
  // ─────────────────────────────────────────────────────────────────────
  const answersRef     = useRef<Record<string, string>>({});
  const subjectRef     = useRef<string | undefined>(subject);
  const attemptIdRef   = useRef<string | null>(null);
  const isSubmittedRef = useRef(false);   // prevents double-submit
  const questionsRef   = useRef<Question[]>([]);

  // Keep refs in sync with state on every render
  answersRef.current   = answers;
  subjectRef.current   = subject;
  questionsRef.current = questions;
  // attemptIdRef is updated manually when attemptId state changes (below)

  // Sync attemptIdRef whenever the state changes
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);

  // ─────────────────────────────────────────────────────────────────────
  // sessionStorage backup — survives page reload, gives sendBeacon a
  // guaranteed source of truth even if React state hasn't updated yet
  // ─────────────────────────────────────────────────────────────────────
  const SESSION_KEY = `quiz_state_${subject}`;

  // Write to sessionStorage whenever answers or attemptId change
  useEffect(() => {
    if (!attemptId && Object.keys(answers).length === 0) return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      subject,
      attemptId,
      answers,
    }));
  }, [answers, attemptId, subject, SESSION_KEY]);

  // Clean up sessionStorage when quiz is done
  const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

  // ─────────────────────────────────────────────────────────────────────
  // fireBeaconSubmit — stored in a ref so event listeners always get
  // the latest version without needing to re-register
  // ─────────────────────────────────────────────────────────────────────
  const fireBeaconSubmitRef = useRef<(reason: string) => void>(() => {});

  useEffect(() => {
    fireBeaconSubmitRef.current = (reason: string) => {
      if (isSubmittedRef.current) return;
      isSubmittedRef.current = true;

      // Read from sessionStorage as the most reliable source
      let savedState: any = {};
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) savedState = JSON.parse(raw);
      } catch {}

      const token     = localStorage.getItem('token');
      const payload   = {
        subject:   savedState.subject   || subjectRef.current,
        answers:   savedState.answers   || answersRef.current,
        attemptId: savedState.attemptId || attemptIdRef.current,
        reason,
      };

      const url = `${API_URL}/student/auto-submit`;

      // ── Primary: fetch with keepalive (works during navigate-away) ──
      const fetchSent = fetch(url, {
        method:    'POST',
        headers:   { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:      JSON.stringify(payload),
        keepalive: true,           // ← key: browser keeps request alive after page unload
      }).then(() => clearSession()).catch(() => {});

      // ── Backup: sendBeacon (works during tab close) ──
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          url,
          new Blob(
            [JSON.stringify({ ...payload, _token: token })],
            { type: 'text/plain' }
          )
        );
      }
    };
  }); // no deps — runs every render so ref always has latest closure

  // ─────────────────────────────────────────────────────────────────────
  // Proctoring
  // ─────────────────────────────────────────────────────────────────────
  const [examStarted, setExamStarted] = useState(false);

  const handleAutoSubmit = () => {
    toast({
      title: "Exam Auto-Submitted",
      description: "Your exam was submitted due to multiple security violations.",
      variant: "destructive",
    });
    handleSubmit(true);
  };

  const proctor = useProctor({
    maxViolations: 3,
    onAutoSubmit: handleAutoSubmit,
    enabled: examStarted && !results,
  });

  const startExam = () => {
    setExamStarted(true);
    proctor.enterFullscreen();
  };

  // ── Register attempt as IN_PROGRESS once questions are loaded ─────────
  // NOTE: attemptId now comes directly from the question-fetch response
  // (start-attempt is no longer needed as a separate call)
  const registerAttemptRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────
  // beforeunload — tab close / browser refresh
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: BeforeUnloadEvent) => {
      if (questionsRef.current.length === 0 || isSubmittedRef.current) return;
      e.preventDefault();
      e.returnValue = 'Your quiz will be auto-submitted if you leave.';
      // Call via ref — always latest, never stale
      fireBeaconSubmitRef.current('EXITED_WITHOUT_SUBMIT');
    };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, []); // empty deps intentional — ref handles freshness

  // ─────────────────────────────────────────────────────────────────────
  // popstate — browser back button
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    window.history.pushState({ quizActive: true }, '');

    const handle = () => {
      if (isSubmittedRef.current || questionsRef.current.length === 0) return;
      const confirmed = window.confirm(
        'You are exiting the quiz.\nYour attempt will be auto-submitted with your current answers.\n\nClick OK to exit, or Cancel to stay.'
      );
      if (confirmed) {
        fireBeaconSubmitRef.current('EXITED_WITHOUT_SUBMIT');
        navigate('/subjects');
      } else {
        window.history.pushState({ quizActive: true }, '');
      }
    };

    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, [navigate]);

  // ─────────────────────────────────────────────────────────────────────
  // visibilitychange — extra safety net (mobile + minimise)
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === 'hidden' &&
          questionsRef.current.length > 0 &&
          !isSubmittedRef.current) {
        // Fire silently — if user comes back we won't double-submit (ref guard)
        fireBeaconSubmitRef.current('EXITED_WITHOUT_SUBMIT');
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchQuestions();
  }, [subject]);

  useEffect(() => {
    if (!loading && !results && questions.length > 0) {
      setTimeLeft(30 * 60); // 30 minutes
    }
  }, [loading, results, questions]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || results) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, results]);

  const fetchQuestions = async () => {
    try {
      const data = await apiFetch(`/student/quizzes/${subject}`);
      if (Array.isArray(data)) {
        setQuestions(data);
      } else {
        setQuestions(data.questions);
        setAttemptId(data.attemptId);
      }
    } catch (error: any) {
      try {
        const parsed = JSON.parse(error.message);
        setErrorInfo(parsed.error || error.message);
      } catch {
        setErrorInfo(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async (autoSubmit = false, reason = 'SUBMITTED') => {
    if (isSubmittedRef.current) return;
    if (!autoSubmit && Object.keys(answers).length < questions.length) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    isSubmittedRef.current = true;
    setSubmitting(true);
    try {
      const result = await apiFetch('/student/submit', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          answers,
          attemptId,
          reason,
        })
      });
      clearSession(); // remove sessionStorage backup on successful submit
      setResults(result);

      // Auto-generate certificate if passed (e.g. >= 40%)
      const percentage = Math.round((result.score / result.total) * 100);
      if (percentage >= 40 && result.attemptId) {
        try {
          const certResult = await apiFetch('/certificates/generate', {
            method: 'POST',
            body: JSON.stringify({
              subject,
              score: result.score,
              total: result.total,
              attemptId: result.attemptId
            })
          });
          if (certResult.certId) {
            setResults(prev => ({ ...prev, certId: certResult.certId }));
          }
        } catch (e) {
          console.error("Failed to generate certificate", e);
        }
      }

      toast({
        title: autoSubmit ? "Quiz Auto-Submitted" : "Quiz Completed!",
        description: `You scored ${result.score} out of ${result.total}`,
      });
    } catch (error: any) {
      toast({
        title: "Error submitting quiz",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (errorInfo) {
    const isLimit = errorInfo.toLowerCase().includes("maximum") || errorInfo.toLowerCase().includes("limit");
    return (
      <Layout>
        <div className="text-center py-12 max-w-lg mx-auto">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl text-destructive font-bold font-heading">
                {isLimit ? "Attempt Limit Reached" : "Quiz Error"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{errorInfo}</p>
              <Button onClick={() => navigate('/subjects')}>Back to Subjects</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No questions available for {subject} yet.</h2>
          <Button onClick={() => navigate('/subjects')}>Back to Subjects</Button>
        </div>
      </Layout>
    );
  }

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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{subject} Quiz</h1>
          {!results && timeLeft !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-warning" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {results ? (
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <h2 className="text-3xl font-bold mb-2">Final Score</h2>
                <div className="text-5xl font-black text-primary mb-4">
                  {results.score} / {results.total}
                </div>
                <p className="text-muted-foreground mb-4">
                  Percentage: {Math.round((results.score / results.total) * 100)}%
                </p>
                <div className="flex gap-6 justify-center mt-4 text-sm font-medium">
                  <div className="flex flex-col items-center p-3 bg-green-500/10 rounded-lg text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5 mb-1" />
                    <span className="text-xl font-bold">{results.correctCount}</span>
                    <span className="text-xs uppercase tracking-wider">Correct</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-red-500/10 rounded-lg text-red-700 dark:text-red-400">
                    <XCircle className="h-5 w-5 mb-1" />
                    <span className="text-xl font-bold">{results.wrongCount}</span>
                    <span className="text-xs uppercase tracking-wider">Wrong</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gray-500/10 rounded-lg text-gray-700 dark:text-gray-400">
                    <Clock className="h-5 w-5 mb-1" />
                    <span className="text-xl font-bold">{results.unattemptedCount}</span>
                    <span className="text-xs uppercase tracking-wider">Unattempted</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Review Answers</h3>
              {results.results.map((res: any, index: number) => (
                <Card key={res.questionId} className={res.isCorrect ? "border-green-500/50" : "border-red-500/50"}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span>{index + 1}. {res.question}</span>
                      {res.isCorrect ? (
                        <CheckCircle2 className="text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="text-red-500 shrink-0" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mt-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-24">Your Answer:</span>
                        <span className={res.isCorrect ? "text-green-600" : "text-red-600 font-medium"}>
                          {res.userAnswer}
                        </span>
                      </div>
                      {!res.isCorrect && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold w-24">Correct:</span>
                          <span className="text-green-600 font-medium">
                            {res.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <FeedbackForm attemptId={results.attemptId} subject={results.subject} questions={results.results} />
            
            <div className="flex justify-center pt-4 gap-4">
              {results.certId && (
                <Button size="lg" variant="default" onClick={() => {
                  const token = localStorage.getItem('token');
                  window.open(`${API_URL}/certificates/${results.certId}/pdf?token=${token}`, '_blank');
                }}>
                  Download Certificate
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => navigate('/subjects')}>
                Return to Subjects
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, index) => (
              <Card key={q._id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {index + 1}. {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    onValueChange={(val) => !proctor.isExamBlocked && handleAnswer(q._id, val)} 
                    value={answers[q._id]}
                    className="space-y-3"
                    style={{ opacity: proctor.isExamBlocked ? 0.35 : 1, pointerEvents: proctor.isExamBlocked ? 'none' : 'auto', transition: 'opacity 0.3s ease' }}
                  >
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                        <RadioGroupItem value={opt} id={`${q._id}-${i}`} disabled={proctor.isExamBlocked} />
                        <Label htmlFor={`${q._id}-${i}`} className="flex-grow cursor-pointer font-normal text-base">
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex justify-end pt-4">
              <Button size="lg" onClick={() => handleSubmit(false)} disabled={submitting || proctor.isExamBlocked}>
                {submitting ? "Submitting..." : proctor.isExamBlocked ? "⏸ Exam Paused" : "Submit Quiz"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
