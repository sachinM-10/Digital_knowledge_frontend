import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Terminal, Coffee } from "lucide-react";
import Layout from "@/components/Layout";

const subjects = [
  {
    id: "C",
    title: "C Programming",
    description: "Test your knowledge of structured programming and memory management.",
    icon: <Terminal className="w-8 h-8 text-blue-500" />,
    color: "bg-blue-500/10",
  },
  {
    id: "Python",
    title: "Python",
    description: "Evaluate your skills in Python algorithms, data structures, and more.",
    icon: <Code className="w-8 h-8 text-yellow-500" />,
    color: "bg-yellow-500/10",
  },
  {
    id: "Java",
    title: "Java",
    description: "Challenge yourself with object-oriented programming concepts.",
    icon: <Coffee className="w-8 h-8 text-red-500" />,
    color: "bg-red-500/10",
  },
];

export default function Subjects() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Programming Languages</h1>
          <p className="text-muted-foreground mt-2">
            Select a subject to start your customized 10-question quiz.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow bg-card">
              <CardHeader>
                <div className={`w-16 h-16 rounded-lg ${subject.color} flex items-center justify-center mb-4`}>
                  {subject.icon}
                </div>
                <CardTitle className="text-2xl">{subject.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {subject.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate(`/subjects/${subject.id}`)}
                >
                  Start {subject.id} Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
