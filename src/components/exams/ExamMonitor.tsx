
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, UserCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getExamById, getExamSubmissions } from "@/services/ExamService";

interface ExamMonitorProps {
  examId?: string;
}

export function ExamMonitor({ examId }: ExamMonitorProps) {
  const [exam, setExam] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const filteredSubmissions = submissions.filter(submission => 
    submission.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <CardTitle className="text-base">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <UserCheck className="h-6 w-6 mr-2 text-primary" />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <Clock className="h-6 w-6 mr-2 text-primary" />
              {submissions.length > 0 
                ? Math.round(submissions.reduce((acc, sub) => {
                    const start = new Date(sub.startTime).getTime();
                    const end = new Date(sub.endTime).getTime();
                    return acc + (end - start) / (1000 * 60);
                  }, 0) / submissions.length)
                : 0} min
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Student Submissions</h2>
          <div className="w-64">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        {filteredSubmissions.length > 0 ? (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
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
                      <div className="text-sm font-medium">Time Taken</div>
                      <div className="text-lg font-bold">
                        {Math.round(
                          (new Date(submission.endTime).getTime() - 
                           new Date(submission.startTime).getTime()) / (1000 * 60)
                        )} min
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">Warnings</div>
                      <div className={`text-lg font-bold ${
                        submission.warningCount > 0 ? "text-destructive" : ""
                      }`}>
                        {submission.warningCount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No submissions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
