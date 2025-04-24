
import { useState, useEffect } from "react";
import { PlusCircle, FileText, Search, Image, BookOpen, Users } from "lucide-react";
import { DashboardOverview } from "./TeacherDashboard/DashboardOverview";
import { ManageStudents } from "./TeacherDashboard/ManageStudents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ref, onValue, set } from 'firebase/database';
import { db } from '@/config/firebase';
import { registerUser } from "@/services/AuthService";
import { getExamsForTeacher, createExam, getTopStudents } from "@/services/ExamService";
import { uploadToCloudinary } from "@/utils/CloudinaryUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchAcademicData } from "@/services/AcademicService";
import { useNavigate } from "react-router-dom";

interface TeacherDashboardProps {
  section?: string;
}

interface StudentData {
  id?: string;
  name: string;
  email: string;
  regNumber: string;
  password: string;
  photo: string;
  semester: string;
}

export function TeacherDashboard({ section }: TeacherDashboardProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<StudentData>({ 
    name: "", 
    email: "", 
    regNumber: "", 
    password: "", 
    photo: "", 
    semester: "Semester 1" 
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [activeTab, setActiveTab] = useState("details");
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examSemester, setExamSemester] = useState("Semester 1");
  const [examDuration, setExamDuration] = useState("60");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isCreateExamDialogOpen, setIsCreateExamDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    id: "1",
    type: "multiple-choice",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1,
    section: "Section 1",
    timeLimit: 5
  });
  const [examSections, setExamSections] = useState([{ id: "section-1", name: "Section 1", timeLimit: 30, questions: [] }]);
  const [currentSection, setCurrentSection] = useState("Section 1");
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [availableSubjectsAll, setAvailableSubjectsAll] = useState<string[]>([]);
  const [subjectsBySemester, setSubjectsBySemester] = useState({});
  const [teacherDepartment, setTeacherDepartment] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const studentsRef = ref(db, 'users');
    const user = localStorage.getItem('examUser');
    
    if (user) {
      const userData = JSON.parse(user);
      const teacherRef = ref(db, `users/${userData.id}`);
      onValue(teacherRef, (snapshot) => {
        if (snapshot.exists()) {
          const teacherData = snapshot.val();
          setTeacherDepartment(teacherData.department || "");
        }
      });

      const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
        if (snapshot.exists()) {
          const studentsList: any[] = [];
          snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData.role === 'student' && userData.department === teacherDepartment) {
              studentsList.push({
                id: childSnapshot.key,
                ...userData,
                status: userData.status || 'active',
                semester: userData.semester || "Semester 1",
                photo: userData.photo || "",
              });
            }
          });
          setStudents(studentsList);
        }
      });

      const fetchExams = async () => {
        const user = localStorage.getItem('examUser');
        if (user) {
          const userData = JSON.parse(user);
          const examsRef = ref(db, 'exams');
          
          const unsubscribeExams = onValue(examsRef, async (snapshot) => {
            if (snapshot.exists()) {
              const teacherExams: any[] = [];
              snapshot.forEach((childSnapshot) => {
                const examData = childSnapshot.val();
                if (examData.createdBy === userData.id) {
                  teacherExams.push({ 
                    id: childSnapshot.key, 
                    ...examData 
                  });
                }
              });
              setExams(teacherExams);
              console.log("Fetched exams:", teacherExams);
            } else {
              setExams([]);
            }
          });

          return () => unsubscribeExams();
        }
        return () => {};
      };
      
      let examsCleanup: () => void = () => {};
      
      (async () => {
        examsCleanup = await fetchExams();
      })();
      
      const loadAcademicData = async () => {
        const data = await fetchAcademicData();
        setAvailableSemesters(["All", ...data.semesters]);
        setAvailableSubjectsAll(["All", ...data.subjects]);
        setSubjectsBySemester(data.subjectsBySemester || {});
      };

      loadAcademicData();

      return () => {
        unsubscribeStudents();
        examsCleanup();
      };
    }
  }, [teacherDepartment]);

  const handleAddStudent = async () => {
    try {
      if (!newStudent.name || !newStudent.email || !newStudent.regNumber || !newStudent.password) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const studentData = {
        name: newStudent.name,
        email: newStudent.email,
        password: newStudent.password,
        role: "student",
        regNumber: newStudent.regNumber,
        semester: newStudent.semester,
        photo: newStudent.photo,
        status: "active",
        department: teacherDepartment
      };
      
      const { success, user, error } = await registerUser(
        studentData.name,
        studentData.email,
        studentData.password,
        "student"
      );
      
      if (success && user) {
        toast({
          title: "Student added",
          description: "New student account has been created successfully",
        });
        
        await set(ref(db, `users/${user.id}`), {
          id: user.id,
          name: studentData.name,
          email: studentData.email,
          role: "student",
          regNumber: studentData.regNumber,
          semester: studentData.semester,
          photo: studentData.photo,
          status: "active",
          department: teacherDepartment
        });
      } else {
        toast({
          title: "Error",
          description: error || "Failed to create student account",
          variant: "destructive"
        });
        return;
      }

      setNewStudent({ name: "", email: "", regNumber: "", password: "", photo: "", semester: "Semester 1" });
      setIsAddStudentDialogOpen(false);
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Add the return statement with JSX
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your students, create exams, and view performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/exam/create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Exam
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardOverview 
            totalExams={exams.length} 
            totalAttended={exams.reduce((acc, exam) => acc + (exam.attendees?.length || 0), 0)}
            studentsPassed={exams.reduce((acc, exam) => acc + (exam.passedCount || 0), 0)}
            selectedSemester={selectedSemester}
            selectedSubject={selectedSubject}
            setSelectedSemester={setSelectedSemester}
            setSelectedSubject={setSelectedSubject}
            SEMESTERS={availableSemesters}
            availableSubjects={availableSubjectsAll}
            subjectData={exams.reduce((acc: {subject: string, count: number}[], exam) => {
              const subjectIndex = acc.findIndex(item => item.subject === exam.subject);
              if (subjectIndex >= 0) {
                acc[subjectIndex].count++;
              } else {
                acc.push({ subject: exam.subject || "Unknown", count: 1 });
              }
              return acc;
            }, [])}
          />
        </TabsContent>

        <TabsContent value="students">
          <ManageStudents
            students={students}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isAddStudentDialogOpen={isAddStudentDialogOpen}
            setIsAddStudentDialogOpen={setIsAddStudentDialogOpen}
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            SEMESTERS={availableSemesters}
            handleAddStudent={handleAddStudent}
            handleEditStudent={(id) => console.log("Edit student", id)}
            handleDeleteStudent={(id) => console.log("Delete student", id)}
          />
        </TabsContent>

        <TabsContent value="exams">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <h2 className="text-2xl font-bold">Manage Exams</h2>
                <p className="text-muted-foreground">Create, monitor, and manage your exams</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="md:w-64"
                />
                <Button onClick={() => navigate('/exam/create')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Exam
                </Button>
              </div>
            </div>

            {exams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <Card key={exam.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>
                        {exam.subject} • {exam.semester}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Date</span>
                          <span className="font-medium">{exam.date || 'Not scheduled'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Duration</span>
                          <span className="font-medium">{exam.duration} minutes</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Questions</span>
                          <span className="font-medium">{exam.questions?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={exam.published ? "default" : "outline"}>
                            {exam.published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 bg-muted/25 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/exam/monitor/${exam.id}`)}
                      >
                        Monitor
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/exam/edit/${exam.id}`)}
                      >
                        Edit
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No exams yet</h3>
                <p className="text-muted-foreground mt-1">Create your first exam to get started</p>
                <Button className="mt-4" onClick={() => navigate('/exam/create')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Exam
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
