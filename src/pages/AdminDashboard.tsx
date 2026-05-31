import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubjectOverview from "@/components/admin/SubjectOverview";
import StudentAnalytics from "@/components/admin/StudentAnalytics";
import PerformanceTable from "@/components/admin/PerformanceTable";
import QuestionBankManager from "@/components/admin/QuestionBankManager";
import ReportGenerator from "@/components/admin/ReportGenerator";
import FeedbackViewer from "@/components/admin/FeedbackViewer";

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      
      <Layout>
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Admin Control Center</h1>
          <p className="mt-1 text-muted-foreground">Manage platform content and analyze student performance</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card w-full justify-start h-auto p-1 border-b pb-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Analytics Overview</TabsTrigger>
            <TabsTrigger value="banks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Question Banks</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Reports & Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <StudentAnalytics />
            <div className="py-2">
              <h2 className="text-xl font-bold font-heading mb-4">Subject Statistics</h2>
              <SubjectOverview />
            </div>
            <PerformanceTable />
          </TabsContent>

          <TabsContent value="banks" className="space-y-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground">Subject Question Banks</h2>
                <p className="text-muted-foreground mt-1 text-sm">View currently configured banks for C, Python and Java tests</p>
              </div>
            </div>
            <QuestionBankManager />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground">Reports & Feedback</h2>
                <p className="text-muted-foreground mt-1 text-sm">Generate exportable reports and view student feedback</p>
              </div>
            </div>
            <ReportGenerator />
            <div className="mt-8">
              <FeedbackViewer />
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
}
