
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, FileText } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/config/firebase";
import { StudentNoticeBoard } from "./StudentDashboard/NoticeBoard";

export function StudentDashboard() {
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [studentId, setStudentId] = useState("");
  const [view, setView] = useState("dashboard");
  const { section } = useParams();

  useEffect(() => {
    if (section) {
      setView(section);
    } else {
      setView("dashboard");
    }
  }, [section]);

  useEffect(() => {
    const user = localStorage.getItem("examUser");
    if (user) {
      const userData = JSON.parse(user);
      setStudentId(userData.id);

      // Fetch exams assigned to this student
      const examsRef = ref(db, "exams");
      onValue(examsRef, (snapshot) => {
        if (snapshot.exists()) {
          const examsList: any[] = [];
          snapshot.forEach((childSnapshot) => {
            const examData = childSnapshot.val();
            // Check if this student is assigned to the exam
            if (
              examData.assignedStudents &&
              examData.assignedStudents.includes(userData.id) &&
              (examData.status === "scheduled" || examData.status === "active")
            ) {
              examsList.push({
                id: childSnapshot.key,
                ...examData,
              });
            }
          });
          
          // Sort by date and time
          examsList.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
          });
          
          setUpcomingExams(examsList);
        }
      });
    }
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (view === "notice-board") {
    return <StudentNoticeBoard />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Student Dashboard</h2>
          <p className="text-muted-foreground">Welcome to your exam portal</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => setView("notice-board")}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Notices
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <CardDescription>
              Exams scheduled for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingExams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exams Taken</CardTitle>
            <CardDescription>
              Completed exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Exam</CardTitle>
            <CardDescription>
              Time until next exam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {upcomingExams.length > 0
                ? formatDate(upcomingExams[0].date)
                : "None scheduled"}
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mt-8">Upcoming Exams</h3>

      {upcomingExams.length > 0 ? (
        <div className="grid gap-4">
          {upcomingExams.map((exam) => (
            <Card key={exam.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{exam.title}</h3>
                    <div className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {exam.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Subject</p>
                      <p className="text-sm font-medium">{exam.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{exam.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-medium">{exam.time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">{exam.duration} min</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 self-end md:self-auto">
                  {exam.status === "active" ? (
                    <Button>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Take Exam
                    </Button>
                  ) : (
                    <Button variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Not Started
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No upcoming exams</p>
            <p className="text-sm text-muted-foreground text-center">
              You don't have any scheduled exams at the moment.
              Check back later or contact your teacher for more information.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
