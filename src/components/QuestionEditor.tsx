import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Props {
  quizId: string;
}

export default function QuestionEditor({ quizId }: Props) {
  const queryClient = useQueryClient();
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState(1);

  const { data: questions } = useQuery({
    queryKey: ["admin-questions", quizId],
    queryFn: async () => {
      const data = await apiFetch(`/quizzes/${quizId}/questions`);
      return data || [];
    },
  });

  const addQuestion = useMutation({
    mutationFn: async () => {
      const validOptions = options.filter((o) => o.trim());
      if (validOptions.length < 2) throw new Error("Add at least 2 options");
      if (!correctAnswer) throw new Error("Select a correct answer");
      if (!validOptions.includes(correctAnswer)) throw new Error("Correct answer must be one of the options");

      await apiFetch(`/quizzes/${quizId}/questions`, {
        method: "POST",
        body: JSON.stringify({
          questionText: questionText,
          options: validOptions,
          correctAnswer: correctAnswer,
          points,
          sortOrder: (questions?.length || 0) + 1,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions", quizId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setPoints(1);
      toast.success("Question added!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/quizzes/${quizId}/questions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions", quizId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      toast.success("Question removedd");
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading">Add Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question Text *</Label>
            <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Enter your question" />
          </div>
          <div className="space-y-3">
            <Label>Options (click radio to set correct answer)</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correctAnswer === opt && opt !== ""}
                  onChange={() => setCorrectAnswer(opt)}
                  className="h-4 w-4 accent-primary"
                  disabled={!opt.trim()}
                />
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    if (correctAnswer === newOpts[i]) setCorrectAnswer(e.target.value);
                    newOpts[i] = e.target.value;
                    setOptions(newOpts);
                  }}
                  placeholder={`Option ${i + 1}`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Points</Label>
              <Input type="number" min={1} value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 1)} className="w-24" />
            </div>
          </div>
          <Button onClick={() => addQuestion.mutate()} disabled={!questionText || addQuestion.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Questions ({questions?.length || 0})
        </h3>
        {questions?.map((q: any, i: number) => (
          <Card key={q._id} className="border-border animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <CardContent className="flex items-start justify-between p-4">
              <div className="flex items-start gap-3">
                <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{q.questionText}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(q.options as string[]).map((opt, j) => (
                      <span
                        key={j}
                        className={`rounded-md px-2 py-1 text-xs ${opt === q.correctAnswer
                            ? "bg-success/10 text-success font-medium"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {String(opt)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{q.points} pt{q.points > 1 ? "s" : ""}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { if (window.confirm("Delete this question?")) deleteQuestion.mutate(q._id); }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
