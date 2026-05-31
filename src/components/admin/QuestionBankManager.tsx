import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuestionBankManager() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery<any[]>({
    queryKey: ["admin-subject-stats-banks"],
    queryFn: async () => {
      const resp = await apiFetch("/admin/subjects/stats");
      return resp;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats?.map((subj) => (
        <div key={subj.subject} className="mb-6">
          <h3 className="font-heading text-xl font-bold mb-3 flex items-center gap-2">
            <span className={`px-2 py-1 rounded-md text-sm font-bold ${
              subj.subject === 'C' ? 'bg-blue-100 text-blue-800' :
              subj.subject === 'Python' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {subj.subject}
            </span>
            <span>Question Banks Overview</span>
          </h3>
          
          <div className="grid gap-4 md:grid-cols-3">
            {subj.banks?.map((bankNum: number) => (
              <Card key={`${subj.subject}-${bankNum}`} className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start text-lg">
                    <span>{subj.subject} Bank #{bankNum}</span>
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Attempt {bankNum} Pool</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    Contains questions mapped to bank {bankNum}. Students take this bank on their attempt number {bankNum}.
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full text-xs" onClick={() => navigate("/admin/subjects")}>
                    <Edit className="h-3 w-3 mr-2" /> Navigate to Editor
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {(subj.banks?.length || 0) === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                No banks created yet for {subj.subject}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
