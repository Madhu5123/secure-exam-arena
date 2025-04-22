
import { useState, useEffect } from "react";
import { Users, FileText, AlertTriangle, PlusCircle, Calendar, Search, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCard } from "@/components/common/UserCard";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ref, onValue, get, push, set } from 'firebase/database';
import { db } from '@/config/firebase';
import { registerUser } from "@/services/AuthService";
import { getExamsForTeacher } from "@/services/ExamService";

/**
 * Props for TeacherDashboard
 * @param section string | undefined (from route): "dashboard" | "students" | "exams"
 */
interface TeacherDashboardProps {
  section?: string;
}

const SEMESTERS = ["All", "Semester 1", "Semester 2", "Semester 3", "Semester 4"];
const SUBJECTS = ["All", "Mathematics", "Science", "History", "English"];

export function TeacherDashboard({ section }: TeacherDashboardProps) {
  // Students and Exams state
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(section || "dashboard");
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", regNumber: "", password: "", photo: "", semester: SEMESTERS[0] });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const { toast } = useToast();

  useEffect(() => {
    if (section) setActiveTab(section);
  }, [section]);

  // Fetch students and exams
  useEffect(() => {
    const studentsRef = ref(db, 'users');
    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const studentsList: any[] = [];
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'student') {
            studentsList.push({
              id: childSnapshot.key,
              ...userData,
              status: userData.status || 'active',
              semester: userData.semester || SEMESTERS[0],
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
        const teacherExams = await getExamsForTeacher(userData.id);
        setExams(teacherExams);
      }
    };
    fetchExams();

    return () => {
      unsubscribeStudents();
    };
  }, []);

  // Add student with photo and semester
  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.regNumber || !newStudent.password || !newStudent.semester) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const { success, user, error } = await registerUser(
        newStudent.name,
        newStudent.email,
        newStudent.password,
        "student"
      );
      if (success && user) {
        toast({
          title: "Student added",
          description: `${newStudent.name} has been added successfully.`,
        });
        await set(ref(db, `users/${user.id}`), {
          id: user.id,
          name: newStudent.name,
          email: newStudent.email,
          role: "student",
          regNumber: newStudent.regNumber,
          status: "active",
          additionalInfo: `Registration #: ${newStudent.regNumber}`,
          photo: newStudent.photo,
          semester: newStudent.semester,
        });
        setNewStudent({ name: "", email: "", regNumber: "", password: "", photo: "", semester: SEMESTERS[0] });
        setIsAddStudentDialogOpen(false);
      } else {
        toast({
          title: "Failed to add student",
          description: error || "An error occurred while adding the student.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Simulated edit handler (for real app, fetch + set form values)
  const handleEditStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      setNewStudent({
        name: student.name,
        email: student.email,
        regNumber: student.regNumber || "",
        password: "",
        photo: student.photo || "",
        semester: student.semester || SEMESTERS[0],
      });
      setIsAddStudentDialogOpen(true);
    }
    toast({
      title: "Edit Student",
      description: `Editing student with ID: ${id}`,
    });
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await set(ref(db, `users/${id}`), null);
      toast({
        title: "Student deleted",
        description: "The student has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    }
  };

  // --- FILTERING & ANALYTICS ---
  const filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch =
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.regNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    // Semester filter
    const matchesSemester = selectedSemester === "All" || student.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  // Filtered exams by semester+subject
  const filteredExams = exams.filter((exam) => {
    const bySemester = selectedSemester === "All" || exam.semester === selectedSemester;
    const bySubject = selectedSubject === "All" || exam.subject === selectedSubject;
    return bySemester && bySubject;
  });

  // Analytics data
  const totalStudents = selectedSemester === "All" ? students.length : students.filter(s => s.semester === selectedSemester).length;
  const activeStudents = filteredStudents.filter(s => s.status === "active").length;
  const totalExams = filteredExams.length;
  const totalAttended = filteredExams.reduce((sum, exam) => sum + (exam.attendance || 0), 0);
  const studentPassed = filteredStudents.filter(s => s.result === "passed").length;

  // Subject and semester breakdown for "analysis"
  // Example subjects, will need to update with real data in real app
  const subjectCounts = SUBJECTS.slice(1).map(subject => ({
    subject,
    exams: exams.filter(e => e.subject === subject && (selectedSemester === "All" || e.semester === selectedSemester)).length,
  }));

  // --- ANALYSIS & FILTER PANEL ---
  const renderDashboardOverview = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block mb-1 text-sm font-semibold">Semester</label>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="border rounded px-4 py-2 bg-background"
          >
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-semibold">Subject</label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="border rounded px-4 py-2 bg-background"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="dashboard-grid">
        <StatsCard
          title="Total Students"
          value={totalStudents}
          description={`Registered in ${selectedSemester === "All" ? "all semesters" : selectedSemester}`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Students"
          value={activeStudents}
          description="Currently active"
          icon={<Users className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="Exams Created"
          value={totalExams}
          description={`For ${selectedSubject}`}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Attended"
          value={totalAttended}
          description="Exam attendances"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard
          title="Students Passed"
          value={studentPassed}
          description="Out of filtered students"
          icon={<Users className="h-4 w-4 text-green-600" />}
        />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">Exams by Subject</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {subjectCounts.map(({ subject, exams }) => (
            <div key={subject} className="bg-muted p-3 rounded flex flex-col items-center">
              <span className="font-semibold">{subject}</span>
              <span className="text-xl">{exams}</span>
              <span className="text-sm text-muted-foreground">exams</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- STUDENT MANAGEMENT PANEL ---
  const renderManageStudents = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Students</h2>
          <p className="text-muted-foreground">Add, edit or remove student accounts</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:w-64"
          />
          <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{newStudent.name ? "Edit Student" : "Add New Student"}</DialogTitle>
                <DialogDescription>
                  {newStudent.name ? "Edit the student details." : "Create a new student account with a unique registration number."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="regNumber">Registration Number</Label>
                  <Input
                    id="regNumber"
                    value={newStudent.regNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, regNumber: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="semester">Semester</Label>
                  <select
                    id="semester"
                    value={newStudent.semester}
                    onChange={e => setNewStudent({ ...newStudent, semester: e.target.value })}
                    className="border rounded px-3 py-2 bg-background"
                  >
                    {SEMESTERS.slice(1).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentPhoto">Profile Image (optional)</Label>
                  <Input
                    id="studentPhoto"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Simulate "upload" by using URL.createObjectURL for demo
                        const url = URL.createObjectURL(file);
                        setNewStudent({ ...newStudent, photo: url });
                      }
                    }}
                  />
                  {newStudent.photo && (
                    <img src={newStudent.photo} alt="preview" className="h-14 w-14 object-cover rounded mt-1" />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentPassword">Initial Password</Label>
                  <Input
                    id="studentPassword"
                    type="password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <Card key={student.id} className="flex flex-col items-center p-4">
              <div className="flex-shrink-0">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="h-16 w-16 rounded-full border object-cover mb-2" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted text-xl flex items-center justify-center mb-2">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="font-bold">{student.name}</div>
              <div className="text-xs text-muted-foreground">{student.email}</div>
              <div className="text-sm mt-1">Semester: <span className="font-medium">{student.semester}</span></div>
              <div className="text-xs mt-2">{student.additionalInfo}</div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => handleEditStudent(student.id)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDeleteStudent(student.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No students found. Add a new student to get started.</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- EXAM MANAGEMENT PANEL ---
  const renderManageExams = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Exams</h2>
          <p className="text-muted-foreground">Create, schedule and monitor exams</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search exams..."
            className="md:w-64"
          />
          <Button /* onClick={} */>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.length > 0 ? (
          exams.map((exam) => (
            <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{exam.title}</CardTitle>
                  <Badge 
                    variant={exam.status === "active" ? "default" : "secondary"}
                  >
                    {exam.status}
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(exam.date).toLocaleDateString()} • {exam.time}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <div>Duration: {exam.duration} minutes</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" size="sm" /* onClick={} */>
                  <FileText className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" /* onClick={} */>
                  <Search className="h-4 w-4 mr-1" />
                  Monitor
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No exams found. Create a new exam to get started.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Main: Only show the single active section
  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-2">
        <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")}>
          Dashboard
        </Button>
        <Button variant={activeTab === "students" ? "default" : "outline"} onClick={() => setActiveTab("students")}>
          Students
        </Button>
        <Button variant={activeTab === "exams" ? "default" : "outline"} onClick={() => setActiveTab("exams")}>
          Exams
        </Button>
      </div>
      {activeTab === "dashboard" && renderDashboardOverview()}
      {activeTab === "students" && renderManageStudents()}
      {activeTab === "exams" && renderManageExams()}
    </div>
  );
}
// ... end of file
