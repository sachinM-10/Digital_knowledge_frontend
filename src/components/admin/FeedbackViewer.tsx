import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/api";
import { Star } from "lucide-react";

export default function FeedbackViewer() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const data = await apiFetch('/feedback');
      setFeedback(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} className={`h-4 w-4 ${rating >= star ? 'fill-primary text-primary' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  };

  if (loading) return <div>Loading feedback...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Feedback & Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Suggestions</TableHead>
              <TableHead>Reported Issue</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No feedback found</TableCell>
              </TableRow>
            ) : (
              feedback.map(f => (
                <TableRow key={f._id}>
                  <TableCell>{f.userId?.name || f.userId?.username || 'Unknown'}</TableCell>
                  <TableCell>{f.subject}</TableCell>
                  <TableCell>{renderStars(f.ratingDifficulty)}</TableCell>
                  <TableCell>{renderStars(f.ratingQuality)}</TableCell>
                  <TableCell className="max-w-xs truncate" title={f.suggestionText}>{f.suggestionText || '-'}</TableCell>
                  <TableCell>
                    {f.reportedQuestionId ? (
                      <div className="text-sm">
                        <div className="font-semibold text-red-500">Issue with Q: {f.reportedQuestionId.question?.substring(0, 30)}...</div>
                        <div>{f.reportText}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{new Date(f.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
