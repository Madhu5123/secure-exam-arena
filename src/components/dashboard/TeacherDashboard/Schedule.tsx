import { useState, useEffect } from "react";
import { CalendarIcon, Plus, Calendar as CalendarLucide } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ref, onValue } from "firebase/database";
import { db } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";
import type { DayProps } from "react-day-picker";

interface Exam {
  id: string;
  title: string;
  date: string;
  time: string;
  subject: string;
  semester: string;
  status: "draft" | "scheduled" | "active" | "completed" | "expired";
}

export function Schedule() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedExams, setSelectedExams] = useState<Exam[]>([]);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem("examUser");
    if (user) {
      const userData = JSON.parse(user);
      const examsRef = ref(db, "exams");

      const unsubscribe = onValue(examsRef, (snapshot) => {
        if (snapshot.exists()) {
          const examsList: Exam[] = [];
          snapshot.forEach((childSnapshot) => {
            const examData = childSnapshot.val();
            if (examData.createdBy === userData.id) {
              examsList.push({
                id: childSnapshot.key,
                title: examData.title,
                date: examData.date,
                time: examData.time,
                subject: examData.subject,
                semester: examData.semester,
                status: examData.status,
              });
            }
          });
          setExams(examsList);
          
          if (date) {
            updateSelectedExams(date);
          }
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const updateSelectedExams = (selectedDate: Date) => {
    const dateString = format(selectedDate, "yyyy-MM-dd");
    const filtered = exams.filter((exam) => exam.date === dateString);
    setSelectedExams(filtered);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      updateSelectedExams(selectedDate);
    } else {
      setSelectedExams([]);
    }
  };

  const handleDateMouseEnter = (date: Date) => {
    setHoveredDate(date);
  };

  const handleDateMouseLeave = () => {
    setHoveredDate(null);
  };

  const hasExam = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return exams.some(exam => exam.date === dateString);
  };

  const getDayClassName = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const isExamDate = exams.some(exam => exam.date === dateString);
    
    const baseClassName = "relative before:content-[''] before:absolute before:left-0 before:right-0 before:bottom-0";
    
    if (isExamDate) {
      return `${baseClassName} before:bg-red-500 before:h-1 hover:bg-red-100`;
    }
    
    return baseClassName;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exam Schedule</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View and manage your exam schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="p-3 pointer-events-auto border rounded-md"
              modifiersClassNames={{
                selected: "bg-primary text-primary-foreground",
              }}
              onDayMouseEnter={handleDateMouseEnter}
              onDayMouseLeave={handleDateMouseLeave}
              components={{
                Day: ({ date: dayDate, displayMonth, ...props }: DayProps & { className?: string }) => {
                  const dateString = format(dayDate, "yyyy-MM-dd");
                  const isExamDate = exams.some(exam => exam.date === dateString);
                  const isHovered = hoveredDate && format(hoveredDate, "yyyy-MM-dd") === dateString;
                  
                  const dayClassName = `${props.className || ''} ${isExamDate ? 'border-b-2 border-red-500' : ''} ${isHovered && isExamDate ? 'bg-red-100' : ''}`;
                  
                  return (
                    <div 
                      {...props} 
                      className={dayClassName}
                    />
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedExams.length > 0
                ? `Exams on ${date ? format(date, "MMMM d, yyyy") : ""}`
                : "Select a date to view exams"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedExams.length > 0 ? (
              <div className="space-y-4">
                {selectedExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{exam.title}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          Subject: {exam.subject}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Time: {exam.time}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Semester: {exam.semester}
                        </div>
                      </div>
                      <Badge
                        className={`${
                          exam.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : exam.status === "active"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {exam.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <CalendarLucide className="w-12 h-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  {date
                    ? "No exams scheduled for this date"
                    : "Select a date to view scheduled exams"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-bold mb-4">All Upcoming Exams</h3>
        <div className="space-y-4">
          {exams
            .filter(
              (exam) =>
                new Date(`${exam.date}T${exam.time}`) >= new Date() &&
                (exam.status === "scheduled" || exam.status === "active")
            )
            .sort(
              (a, b) =>
                new Date(`${a.date}T${a.time}`).getTime() -
                new Date(`${b.date}T${b.time}`).getTime()
            )
            .map((exam) => (
              <div
                key={exam.id}
                className="p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{exam.title}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      Date: {format(new Date(exam.date), "MMMM d, yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Time: {exam.time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Subject: {exam.subject} | Semester: {exam.semester}
                    </div>
                  </div>
                  <Badge
                    className={`${
                      exam.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : exam.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {exam.status}
                  </Badge>
                </div>
              </div>
            ))}
          {!exams.some(
            (exam) =>
              new Date(`${exam.date}T${exam.time}`) >= new Date() &&
              (exam.status === "scheduled" || exam.status === "active")
          ) && (
            <div className="text-center py-4 text-muted-foreground">
              No upcoming exams scheduled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
