
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getExamsForStudent } from "@/services/ExamService";

export function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      const user = localStorage.getItem('examUser');
      if (user) {
        const userData = JSON.parse(user);
        const studentExams = await getExamsForStudent(userData.id);
        setExams(studentExams);
        setLoading(false);
      }
    };

    fetchExams();
    
    // Set up an interval to refresh exam status every minute
    const intervalId = setInterval(fetchExams, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleStartExam = (examId: string) => {
    toast({
      title: "Starting exam",
      description: "Preparing your exam environment...",
    });
    navigate(`/exam/${examId}`);
  };

  const handleViewResults = (examId: string) => {
    toast({
      title: "View Results",
      description: `Viewing results for exam ID: ${examId}`,
    });
  };

  // Check if an exam is currently active based on date and time
  const isExamActive = (exam: any) => {
    if (exam.status === "completed") return false;
    
    const currentDate = new Date();
    const [year, month, day] = exam.date.split('-').map(Number);
    const [hours, minutes] = exam.time.split(':').map(Number);
    const examDate = new Date(year, month - 1, day, hours, minutes);
    
    const examEndDate = new Date(examDate);
    examEndDate.setMinutes(examEndDate.getMinutes() + exam.duration);
    
    return currentDate >= examDate && currentDate < examEndDate;
  };

  // Sort exams by their status and date
  const sortedExams = [...exams].sort((a, b) => {
    // First by status priority
    const statusPriority: Record<string, number> = { 
      active: 0, 
      scheduled: 1, 
      completed: 2 
    };
    
    // Then by date (for scheduled exams)
    if (statusPriority[a.status] === statusPriority[b.status]) {
      return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
    }
    
    return statusPriority[a.status] - statusPriority[b.status];
  });

  // Filter exams by status
  const upcomingExams = sortedExams.filter(e => e.status === "scheduled");
  const availableExams = sortedExams.filter(e => e.status === "active" || isExamActive(e));
  const completedExams = sortedExams.filter(e => e.status === "completed");

  return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        <StatsCard
          title="Available Exams"
          value={availableExams.length}
          description="Exams ready to take"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Upcoming Exams"
          value={upcomingExams.length}
          description="Scheduled in your calendar"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatsCard
          title="Completed Exams"
          value={completedExams.length}
          description="Finished assessments"
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <div className="h-8 w-8 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground mt-2">Loading your exams...</p>
        </div>
      ) : (
        <>
          {availableExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Available Exams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableExams.map((exam) => (
                  <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription>{exam.subject}</CardDescription>
                        </div>
                        <Badge className="bg-exam-success">Available</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Date & Time:</span> {new Date(exam.date).toLocaleDateString()} at {exam.time}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Duration:</span> {exam.duration} minutes
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Teacher:</span> {exam.teacher}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button className="w-full" onClick={() => handleStartExam(exam.id)}>
                        Start Exam
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {upcomingExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Upcoming Exams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingExams.map((exam) => (
                  <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription>{exam.subject}</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-exam-primary text-exam-primary">
                          Upcoming
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Date & Time:</span> {new Date(exam.date).toLocaleDateString()} at {exam.time}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Duration:</span> {exam.duration} minutes
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Teacher:</span> {exam.teacher}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button disabled variant="outline" className="w-full">
                        Not Yet Available
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Completed Exams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedExams.map((exam) => (
                  <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription>{exam.subject}</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <span className="font-medium">Date Taken:</span> {new Date(exam.date).toLocaleDateString()}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Score:</span>
                            <span>{exam.score}%</span>
                          </div>
                          <Progress value={exam.score} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button variant="outline" className="w-full" onClick={() => handleViewResults(exam.id)}>
                        View Results
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {exams.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No exams assigned to you yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
