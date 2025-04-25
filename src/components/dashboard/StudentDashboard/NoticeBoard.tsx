
import { useState, useEffect } from "react";
import { Post } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ref, onValue } from "firebase/database";
import { db } from "@/config/firebase";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  semester: string;
  department: string;
  createdBy: string;
  createdAt: string;
  teacherName: string;
}

export function StudentNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [studentSemester, setStudentSemester] = useState("");
  const [studentDepartment, setStudentDepartment] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    const user = localStorage.getItem("examUser");
    if (user) {
      const userData = JSON.parse(user);
      
      // Fetch student information
      const studentRef = ref(db, `users/${userData.id}`);
      onValue(studentRef, (snapshot) => {
        if (snapshot.exists()) {
          const studentData = snapshot.val();
          setStudentSemester(studentData.semester || "");
          setStudentDepartment(studentData.department || "");
        }
      });
    }
  }, []);

  useEffect(() => {
    if (studentSemester && studentDepartment) {
      // Fetch notices relevant to this student's semester and department
      const noticesRef = ref(db, "notices");
      onValue(noticesRef, (snapshot) => {
        if (snapshot.exists()) {
          const noticesList: Notice[] = [];
          snapshot.forEach((childSnapshot) => {
            const noticeData = childSnapshot.val();
            // Only show notices for this student's semester and department
            if (noticeData.semester === studentSemester && 
                noticeData.department === studentDepartment) {
              noticesList.push({
                id: childSnapshot.key as string,
                ...noticeData,
              });
            }
          });
          // Sort by created date, newest first
          noticesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotices(noticesList);
        }
      });
    }
  }, [studentSemester, studentDepartment]);

  const filteredNotices = notices.filter(notice => {
    return selectedType === "all" || notice.type === selectedType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notice Board</h2>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notices</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredNotices.length > 0 ? (
        <div className="grid gap-4">
          {filteredNotices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{notice.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Badge
                        className={`${
                          notice.type === "exam"
                            ? "bg-red-100 text-red-800"
                            : notice.type === "academic"
                            ? "bg-blue-100 text-blue-800"
                            : notice.type === "event"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {notice.type}
                      </Badge>
                      <span>|</span>
                      <span>
                        Posted: {format(new Date(notice.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{notice.content}</p>
              </CardContent>
              <CardFooter className="border-t pt-2 text-sm text-muted-foreground">
                Posted by: {notice.teacherName}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Post className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {selectedType === "all"
                ? "No notices available for your semester."
                : `No ${selectedType} notices available for your semester.`}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
