import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PerformanceResult {
  studentName: string;
  studentEmail: string;
  subject: string;
  numberOfAttempts: number;
  highestScore: number;
  latestScore: number;
  latestTotal: number;
  highestTotal: number;
  lastAttemptDate: string;
}

export default function PerformanceTable() {
  const [search, setSearch] = useState("");

  const { data: results, isLoading } = useQuery<PerformanceResult[]>({
    queryKey: ["admin-performance-results"],
    queryFn: async () => {
      const resp = await apiFetch("/admin/students/results");
      return resp;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const filteredResults = results?.filter((r) => 
    r.studentName.toLowerCase().includes(search.toLowerCase()) || 
    r.studentEmail.toLowerCase().includes(search.toLowerCase()) || 
    r.subject.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Performance Table</CardTitle>
            <CardDescription>View detailed logs of all completed student assessments</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or subject..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No results found matching your search.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Subject Attempted</TableHead>
                <TableHead className="text-center">Attempts</TableHead>
                <TableHead className="text-center">Latest Score</TableHead>
                <TableHead className="text-center">Highest Score</TableHead>
                <TableHead className="text-right">Last Attempt Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-medium">{row.studentName}</div>
                    <div className="text-xs text-muted-foreground">{row.studentEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${row.subject === 'C' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20' : ''}
                      ${row.subject === 'Python' ? 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20' : ''}
                      ${row.subject === 'Java' ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20' : ''}
                    `}>
                      {row.subject}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{row.numberOfAttempts}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold">{row.latestScore}</span>
                    <span className="text-muted-foreground text-xs"> / {row.latestTotal}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-success">{row.highestScore}</span>
                    <span className="text-muted-foreground text-xs"> / {row.highestTotal}</span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(row.lastAttemptDate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
