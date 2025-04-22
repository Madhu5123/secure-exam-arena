import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockExamData = {
  id: "exam1",
  title: "Advanced Calculus Final Examination",
  subject: "Mathematics",
  duration: 180,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
  status: "in-progress",
  students: [
    { 
      id: "student1", 
      name: "Thomas Anderson", 
      status: "active", 
      progress: 65, 
      cheatingWarnings: 0,
      lastActivity: "Question 12/15",
      cameraStatus: "ok"
    },
    { 
      id: "student2", 
      name: "Sofia Patel", 
      status: "active", 
      progress: 80, 
      cheatingWarnings: 0,
      lastActivity: "Question 13/15",
      cameraStatus: "ok"
    },
    { 
      id: "student3", 
      name: "James Wilson", 
      status: "disconnected", 
      progress: 40, 
      cheatingWarnings: 1,
      lastActivity: "Question 6/15",
      cameraStatus: "disconnected"
    },
    { 
      id: "student4", 
      name: "Emma Rodriguez", 
      status: "completed", 
      progress: 100, 
      cheatingWarnings: 0,
      lastActivity: "Completed",
      cameraStatus: "ok"
    },
  ]
};

export function ExamMonitor() {
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState<string>("00:00:00");
  const [activeTab, setActiveTab] = useState("overview");
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock the fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      // In a real app, this would fetch from Firebase
      setExam(mockExamData);
      setLoading(false);
    };

    fetchExam();
  }, [id]);

  // Calculate and update remaining time
  useEffect(() => {
    if (!exam) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(exam.endTime).getTime();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        clearInterval(interval);
        setRemainingTime("00:00:00");
        // In a real app, this would update the exam status
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setRemainingTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [exam]);

  const handleEndExam = () => {
    toast({
      title: "End exam",
      description: "This will end the exam for all students. Are you sure?",
      action: (
        <Button variant="destructive" onClick={() => {
          toast({
            title: "Exam ended",
            description: "The exam has been ended for all students",
          });
          navigate("/dashboard");
        }}>
          End Exam
        </Button>
      ),
    });
  };

  const handleStudentWarning = (studentId: string) => {
    toast({
      title: "Warning sent",
      description: "A warning has been sent to the student",
    });

    // In a real app, this would update the student's warning count in Firebase
    setExam({
      ...exam,
      students: exam.students.map((student: any) => {
        if (student.id === studentId) {
          return {
            ...student,
            cheatingWarnings: student.cheatingWarnings + 1,
          };
        }
        return student;
      }),
    });
  };

  const handleDisconnect = (studentId: string) => {
    toast({
      title: "Student disconnected",
      description: "The student has been disconnected from the exam",
    });

    // In a real app, this would update the student's status in Firebase
    setExam({
      ...exam,
      students: exam.students.map((student: any) => {
        if (student.id === studentId) {
          return {
            ...student,
            status: "disconnected",
            cameraStatus: "disconnected",
          };
        }
        return student;
      }),
    });
  };

  const renderCameraStatus = (status: string) => {
    switch(status) {
      case "ok":
        return <Badge className="bg-exam-success">Camera OK</Badge>;
      case "warning":
        return <Badge className="bg-exam-warning animate-pulse-warning">Cheating Detected</Badge>;
      case "disconnected":
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Disconnected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderStudentStatus = (status: string) => {
    switch(status) {
      case "active":
        return <Badge className="bg-exam-success">Active</Badge>;
      case "disconnected":
        return <Badge className="bg-exam-warning">Disconnected</Badge>;
      case "completed":
        return <Badge className="bg-exam-primary">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleEndExam}>
            End Exam
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Time Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <Clock className="h-6 w-6 mr-2 text-exam-primary" />
              {remainingTime}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <UserCheck className="h-6 w-6 mr-2 text-exam-primary" />
              {exam.students.length} students
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="text-exam-success">{exam.students.filter((s: any) => s.status === "active").length} active</span>
              {" • "}
              <span className="text-exam-warning">{exam.students.filter((s: any) => s.status === "disconnected").length} disconnected</span>
              {" • "}
              <span className="text-exam-primary">{exam.students.filter((s: any) => s.status === "completed").length} completed</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cheating Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-exam-warning" />
              {exam.students.reduce((sum: number, student: any) => sum + student.cheatingWarnings, 0)} alerts
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {exam.students.filter((s: any) => s.cameraStatus === "warning").length} students currently flagged
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({exam.students.filter((s: any) => s.cameraStatus === "warning").length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4">
          <div className="space-y-4">
            {exam.students.map((student: any) => (
              <Card key={student.id} className={`overflow-hidden transition-all ${
                student.cameraStatus === "warning" ? "border-exam-warning" : ""
              }`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="font-medium">{student.name}</div>
                      <div className="flex gap-2 mt-1">
                        {renderStudentStatus(student.status)}
                        {renderCameraStatus(student.cameraStatus)}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="text-sm mb-1">Progress: {student.progress}%</div>
                      <Progress value={student.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">{student.lastActivity}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">Warnings</div>
                      <div className={`text-lg font-bold ${
                        student.cheatingWarnings > 0 ? "text-exam-warning" : ""
                      }`}>
                        {student.cheatingWarnings}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={student.status !== "active"}
                        onClick={() => handleStudentWarning(student.id)}
                        className="text-exam-warning hover:bg-exam-warning/10 hover:text-exam-warning"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Warn
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={student.status !== "active"}
                        onClick={() => handleDisconnect(student.id)}
                        className="text-exam-danger hover:bg-exam-danger/10 hover:text-exam-danger"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="flagged" className="pt-4">
          <div className="space-y-4">
            {exam.students.filter((s: any) => s.cameraStatus === "warning").length > 0 ? (
              exam.students
                .filter((s: any) => s.cameraStatus === "warning")
                .map((student: any) => (
                  <Card key={student.id} className="overflow-hidden border-exam-warning">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div className="md:col-span-2">
                          <div className="font-medium">{student.name}</div>
                          <div className="flex gap-2 mt-1">
                            {renderStudentStatus(student.status)}
                            {renderCameraStatus(student.cameraStatus)}
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <div className="text-sm mb-1">Progress: {student.progress}%</div>
                          <Progress value={student.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{student.lastActivity}</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium">Warnings</div>
                          <div className={`text-lg font-bold ${
                            student.cheatingWarnings > 0 ? "text-exam-warning" : ""
                          }`}>
                            {student.cheatingWarnings}
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={student.status !== "active"}
                            onClick={() => handleStudentWarning(student.id)}
                            className="text-exam-warning hover:bg-exam-warning/10 hover:text-exam-warning"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Warn
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={student.status !== "active"}
                            onClick={() => handleDisconnect(student.id)}
                            className="text-exam-danger hover:bg-exam-danger/10 hover:text-exam-danger"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-exam-success mx-auto mb-2" />
                <p className="text-muted-foreground">No students currently flagged for cheating.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
