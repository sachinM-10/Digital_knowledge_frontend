import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/api";

export default function ReportGenerator() {
  const [subject, setSubject] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [passFail, setPassFail] = useState<string>("all");

  const buildQuery = (format: string) => {
    const params = new URLSearchParams({ format });
    if (subject && subject !== "all") params.append('subject', subject);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (passFail && passFail !== "all") params.append('passFail', passFail);
    return params.toString();
  };

  const handleDownload = (format: string) => {
    const token = localStorage.getItem("token");
    const url = `${API_URL}/reports/results?${buildQuery(format)}`;
    
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error("Failed to download report");
      return response.blob();
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      a.download = `Results_Report.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => console.error("Error downloading report:", err));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Generator</CardTitle>
        <CardDescription>Export student performance reports in Excel format.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Subject Filter</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Java">Java</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={passFail} onValueChange={setPassFail}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed (&gt;= 40%)</SelectItem>
                <SelectItem value="failed">Failed (&lt; 40%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => handleDownload('excel')} variant="default">Download Excel Report</Button>
        </div>
      </CardContent>
    </Card>
  );
}
