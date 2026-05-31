import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { apiFetch } from "@/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SubjectQuestion {
  _id?: string;
  subject: string;
  bank: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function SubjectAdmin() {
  const { user, isAdmin } = useAuth();
  const [questions, setQuestions] = useState<SubjectQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubjectQuestion>({
    subject: "C",
    bank: 1,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: ""
  });

  if (!isAdmin) {
    return <Navigate to="/student-dashboard" replace />;
  }

  useEffect(() => {
    fetchQuestions();
  }, [subjectFilter, bankFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let endpoint = '/admin/questions?';
      const params = [];
      if (subjectFilter !== "all") params.push(`subject=${subjectFilter}`);
      if (bankFilter !== "all") params.push(`bank=${bankFilter}`);
      endpoint += params.join('&');
      const data = await apiFetch(endpoint);
      setQuestions(data);
    } catch (error: any) {
      toast({
        title: "Error fetching questions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      await apiFetch('/seed', { method: 'POST' });
      toast({ title: "Database seeded successfully" });
      fetchQuestions();
    } catch (error: any) {
      toast({ title: "Failed to seed", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    
    try {
      await apiFetch(`/admin/question/${id}`, { method: 'DELETE' });
      toast({ title: "Question deleted" });
      setQuestions(q => q.filter(item => item._id !== id));
    } catch (error: any) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    }
  };

  const openEdit = (q: SubjectQuestion) => {
    setFormData({ ...q });
    setEditingId(q._id!);
    setOpen(true);
  };

  const openCreate = () => {
    setFormData({ subject: "C", bank: 1, question: "", options: ["", "", "", ""], correctAnswer: "" });
    setEditingId(null);
    setOpen(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.options.includes(formData.correctAnswer)) {
      toast({ title: "Validation Error", description: "Correct answer must match one of the options", variant: "destructive" });
      return;
    }

    try {
      if (editingId) {
        await apiFetch(`/admin/question/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast({ title: "Question updated successfully" });
      } else {
        await apiFetch(`/admin/question`, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast({ title: "Question added successfully" });
      }
      setOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Subject Quizzes</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove questions for C, Python, and Java</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed}>Seed Example Questions</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><PlusCircle className="mr-2 h-4 w-4" /> Add Question</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Question</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitForm} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={formData.subject} onValueChange={(val) => setFormData({...formData, subject: val})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C">C Programming</SelectItem>
                        <SelectItem value="Python">Python</SelectItem>
                        <SelectItem value="Java">Java</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Question Bank</Label>
                    <Select value={formData.bank?.toString() || "1"} onValueChange={(val) => setFormData({...formData, bank: parseInt(val)})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Bank 1 (Attempt 1)</SelectItem>
                        <SelectItem value="2">Bank 2 (Attempt 2)</SelectItem>
                        <SelectItem value="3">Bank 3 (Attempt 3)</SelectItem>
                        <SelectItem value="4">Bank 4 (Attempt 4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea required value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formData.options.map((opt, i) => (
                    <div key={i} className="space-y-2">
                      <Label>Option {i + 1}</Label>
                      <Input required value={opt} onChange={e => handleOptionChange(i, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Correct Answer (Must match exactly one option)</Label>
                  <Select value={formData.correctAnswer} onValueChange={(val) => setFormData({...formData, correctAnswer: val})}>
                    <SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                    <SelectContent>
                      {formData.options.map((opt, i) => opt && (
                        <SelectItem key={i} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Save Question</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xl font-bold">Question Bank</CardTitle>
          <div className="flex gap-2">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="C">C Programming</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Java">Java</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bankFilter} onValueChange={setBankFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                <SelectItem value="1">Bank 1</SelectItem>
                <SelectItem value="2">Bank 2</SelectItem>
                <SelectItem value="3">Bank 3</SelectItem>
                <SelectItem value="4">Bank 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>No questions found. Click "Seed Example Questions" or add a new one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Subject</TableHead>
                  <TableHead className="w-[100px]">Bank</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q._id}>
                    <TableCell className="font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        q.subject === 'C' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        q.subject === 'Python' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {q.subject}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-muted border border-border">
                        Bank {q.bank}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={q.question}>{q.question}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(q)}><Edit3 className="h-4 w-4 text-blue-500" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(q._id!)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
