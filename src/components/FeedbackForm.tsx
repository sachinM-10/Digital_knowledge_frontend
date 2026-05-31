import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface FeedbackFormProps {
  attemptId: string;
  subject: string;
  questions: any[];
}

export default function FeedbackForm({ attemptId, subject, questions }: FeedbackFormProps) {
  const { toast } = useToast();
  const [ratingDifficulty, setRatingDifficulty] = useState<number>(0);
  const [ratingQuality, setRatingQuality] = useState<number>(0);
  const [suggestionText, setSuggestionText] = useState("");
  const [reportedQuestionId, setReportedQuestionId] = useState<string>("none");
  const [reportText, setReportText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingDifficulty || !ratingQuality) {
      toast({
        title: "Required fields missing",
        description: "Please rate both difficulty and quality.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          attemptId,
          subject,
          ratingDifficulty,
          ratingQuality,
          suggestionText,
          reportedQuestionId: reportedQuestionId !== "none" ? reportedQuestionId : null,
          reportText
        })
      });
      setSubmitted(true);
      toast({ title: "Feedback submitted", description: "Thank you for your feedback!" });
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="mt-8 border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6 text-center text-green-700 dark:text-green-400">
          <p className="font-semibold">Thank you for your feedback!</p>
        </CardContent>
      </Card>
    );
  }

  const renderStars = (rating: number, setRating: (val: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 cursor-pointer transition-colors ${rating >= star ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>Help us improve your experience by sharing your thoughts.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Test Difficulty *</Label>
              {renderStars(ratingDifficulty, setRatingDifficulty)}
            </div>
            <div className="space-y-2">
              <Label>Question Quality *</Label>
              {renderStars(ratingQuality, setRatingQuality)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Suggest Improvements</Label>
            <Textarea
              placeholder="Any suggestions to improve the test?"
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold">Report a Problem (Optional)</Label>
            <div className="space-y-2">
              <Label>Select Question</Label>
              <Select value={reportedQuestionId} onValueChange={setReportedQuestionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a question if there is an issue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific question</SelectItem>
                  {questions.map((q, idx) => (
                    <SelectItem key={q.questionId || q._id} value={q.questionId || q._id}>
                      {idx + 1}. {q.question.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reportedQuestionId !== "none" && (
              <div className="space-y-2">
                <Label>Issue Description</Label>
                <Textarea
                  placeholder="Describe the issue with this question (e.g., wrong options, unclear phrasing)"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
