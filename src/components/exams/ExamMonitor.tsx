import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getExamById, getExamSubmissions } from "@/services/ExamService";

interface ExamMonitorProps {
  examId?: string;
}

// Mock data
const mockExamData = {
  id: "exam-1",
  title: "Mid-term Mathematics",
  subject: "Mathematics",
  duration: 120,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
  status: "in-progress",
  students: [
    { 
      id: "student-1", 
      name: "Alex Johnson", 
      status: "active", 
      progress: 45, 
      cheatingWarnings: 1,
      lastActivity: "Question 6/15",
      cameraStatus: "ok"
    },
    { 
      id: "student-2", 
      name: "Emily Chen", 
      status: "active", 
      progress: 60, 
      cheatingWarnings: 0,
      lastActivity: "Question 8/15",
      cameraStatus: "ok"
    },
    { 
      id: "student-3", 
      name: "Michael Brown", 
      status: "disconnected", 
      progress: 20, 
      cheatingWarnings: 0,
      lastActivity: "Question 3/15",
      cameraStatus: "disconnected"
    },
    { 
      id: "student-4", 
      name: "Sarah Williams", 
      status: "active", 
      progress: 30, 
      cheatingWarnings: 3,
      lastActivity: "Question 4/15",
      cameraStatus: "warning"
    },
    { 
      id: "student-5", 
      name: "James Davis", 
      status: "completed", 
      progress: 100, 
      cheatingWarnings: 0,
      lastActivity: "Completed",
      cameraStatus: "ok"
    },
  ]
};

export function ExamMonitor({ examId }: ExamMonitorProps) {
  const [exam, setExam] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch exam data and submissions
  useEffect(() => {
    const fetchExamData = async () => {
      if (examId) {
        try {
          const [examResult, submissionsResult] = await Promise.all([
            getExamById(examId),
            getExamSubmissions(examId)
          ]);
          
          if (examResult.success) {
            setExam(examResult.exam);
          }
          
          if (submissionsResult.success) {
            setSubmissions(submissionsResult.submissions);
          }
        } catch (error) {
          console.error("Error fetching exam data:", error);
          toast({
            title: "Error",
            description: "Failed to load exam data",
            variant: "destructive",
          });
        }
      }
      setLoading(false);
    };

    fetchExamData();
  }, [examId, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-2 text-muted-foreground">Loading exam data...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Exam not found or access denied.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground">{exam.subject}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <UserCheck className="h-6 w-6 mr-2 text-exam-primary" />
              {submissions.length} students
            </div>
            {submissions.length > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                Average score: {Math.round(
                  submissions.reduce((acc, sub) => acc + (sub.percentage || 0), 0) / submissions.length
                )}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="submissions" className="pt-4">
          <div className="space-y-4">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <Card key={submission.studentId}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      <div className="md:col-span-2">
                        <div className="font-medium">Student ID: {submission.studentId}</div>
                        <div className="text-sm text-muted-foreground">
                          Completed: {new Date(submission.endTime).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">Score</div>
                        <div className="text-lg font-bold">
                          {submission.score}/{submission.maxScore}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {submission.percentage}%
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">Warnings</div>
                        <div className={`text-lg font-bold ${
                          submission.warningCount > 0 ? "text-exam-warning" : ""
                        }`}>
                          {submission.warningCount}
                        </div>
                      </div>
                      
                      {submission.sectionScores && (
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium mb-1">Section Scores</div>
                          {submission.sectionScores.map((section: any) => (
                            <div key={section.sectionId} className="text-sm">
                              Section {section.sectionId}: {section.score}/{section.maxScore}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No submissions yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
