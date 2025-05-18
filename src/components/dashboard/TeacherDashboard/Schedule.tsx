
import { useState, useEffect } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ref, onValue } from 'firebase/database';
import { db } from '@/config/firebase';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DayProps } from "react-day-picker";

interface Exam {
  id: string;
  title: string;
  date: string; // Format: yyyy-MM-dd
  time: string;
  subject: string;
  semester: string;
  status: string;
  department: string;
}

export function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [exams, setExams] = useState<Exam[]>([]);
  const [examDates, setExamDates] = useState<Date[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem('examUser');
    if (!user) return;
    
    const userData = JSON.parse(user);
    const examsRef = ref(db, 'exams');

    const unsubscribeExams = onValue(examsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allExams: Exam[] = [];
        const dates: Date[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const examData = childSnapshot.val();
          if (
            examData.createdBy === userData.id ||
            examData.department === userData.department
          ) {
            const exam = {
              id: childSnapshot.key,
              ...examData
            };
            allExams.push(exam);
            // Parse exam date to Date object (skip if not valid)
            if (exam.date) {
              try {
                // Accept either yyyy-MM-dd or ISO string
                let parsedDate: Date;
                if (/\d{4}-\d{2}-\d{2}/.test(exam.date)) {
                  parsedDate = parseISO(exam.date);
                } else {
                  parsedDate = new Date(exam.date);
                }
                if (!isNaN(parsedDate.getTime())) {
                  dates.push(parsedDate);
                }
              } catch (err) {
                console.error("Invalid date format:", exam.date);
              }
            }
          }
        });
        console.log("Loaded exams:", allExams);
        console.log("Parsed exam dates:", dates.map(d => d.toISOString()));
        setExams(allExams);
        setExamDates(dates);
      }
    });

    return () => unsubscribeExams();
  }, []);

  // Filter exams for the selected date
  const selectedDateExams = exams.filter(exam => {
    if (!selectedDate || !exam.date) return false;
    try {
      // Normalize comparison: strip to date only (remove times)
      const examDateObj = /\d{4}-\d{2}-\d{2}/.test(exam.date)
        ? parseISO(exam.date)
        : new Date(exam.date);
      return isSameDay(examDateObj, selectedDate);
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Schedule</h2>
          <p className="text-muted-foreground">View and manage your exam schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar 
              mode="single" 
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiersClassNames={{
                today: "bg-accent text-accent-foreground",
              }}
              modifiers={{
                examDay: examDates
              }}
              modifiersStyles={{
                examDay: { fontWeight: "bold" }
              }}
              className="rounded-md border"
              components={{
                Day: ({ date, className, ...props }: DayProps & { className?: string }) => {
                  // Highlight exam days
                  const isExamDay = examDates.some(examDate =>
                    examDate && isSameDay(examDate, date)
                  );
                  return (
                    <div
                      {...props}
                      className={cn(
                        className,
                        isExamDay && "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 font-semibold"
                      )}
                    >
                      {format(date, "d")}
                    </div>
                  );
                }
              }}
            />
            <div className="mt-4 flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Exam Day</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate ? (
                `Exams for ${format(selectedDate, "MMMM d, yyyy")}`
              ) : (
                "Select a date to view exams"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateExams.length > 0 ? (
              <div className="space-y-4">
                {selectedDateExams.map((exam) => (
                  <div key={exam.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                      <div>
                        <h3 className="font-medium text-lg">{exam.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary">{exam.subject}</Badge>
                          <Badge variant="outline">{exam.semester}</Badge>
                          <Badge variant={
                            exam.status === 'active' ? 'default' : 
                            exam.status === 'completed' ? 'secondary' : 
                            'outline'
                          }>
                            {exam.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Time: {exam.time}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2 md:mt-0">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No exams scheduled for this date
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
