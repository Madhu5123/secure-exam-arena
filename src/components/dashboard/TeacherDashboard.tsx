import { useState, useEffect } from "react";
import { Users, FileText, AlertTriangle, PlusCircle, Calendar, Search } from "lucide-react";
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

// Mock data for initial display
const mockStudents = [
  { 
    id: "student1", 
    name: "Thomas Anderson", 
    email: "t.anderson@university.edu", 
    role: "student", 
    status: "active", 
    additionalInfo: "Registration #: UNI2025001" 
  },
  { 
    id: "student2", 
    name: "Sofia Patel", 
    email: "s.patel@university.edu", 
    role: "student", 
    status: "active", 
    additionalInfo: "Registration #: UNI2025002" 
  },
  { 
    id: "student3", 
    name: "James Wilson", 
    email: "j.wilson@university.edu", 
    role: "student", 
    status: "active", 
    additionalInfo: "Registration #: UNI2025003" 
  },
  { 
    id: "student4", 
    name: "Emma Rodriguez", 
    email: "e.rodriguez@university.edu", 
    role: "student", 
    status: "active", 
    additionalInfo: "Registration #: UNI2025004" 
  }
];

const mockExams = [
  { 
    id: "exam1", 
    title: "Advanced Calculus Final Examination", 
    date: "2025-05-15", 
    time: "09:00", 
    duration: 180, 
    status: "scheduled" 
  },
  { 
    id: "exam2", 
    title: "Quantum Physics Mid-term", 
    date: "2025-05-20", 
    time: "14:00", 
    duration: 120, 
    status: "draft" 
  },
  { 
    id: "exam3", 
    title: "Organic Chemistry Assessment", 
    date: "2025-05-25", 
    time: "10:00", 
    duration: 150, 
    status: "active" 
  }
];

export function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", regNumber: "", password: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would fetch from Firebase
    setStudents(mockStudents);
    setExams(mockExams);
  }, []);

  const handleAddStudent = () => {
    // Validation
    if (!newStudent.name || !newStudent.email || !newStudent.regNumber || !newStudent.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would add to Firebase
    const newId = String(students.length + 1);
    setStudents([
      ...students,
      {
        id: newId,
        name: newStudent.name,
        email: newStudent.email,
        role: "student",
        status: "active",
        additionalInfo: `Registration #: ${newStudent.regNumber}`,
      },
    ]);

    toast({
      title: "Student added",
      description: `${newStudent.name} has been added successfully.`,
    });

    // Reset form and close dialog
    setNewStudent({ name: "", email: "", regNumber: "", password: "" });
    setIsAddStudentDialogOpen(false);
  };

  const handleViewStudent = (id: string) => {
    toast({
      title: "View Student",
      description: `Viewing student with ID: ${id}`,
    });
  };

  const handleEditStudent = (id: string) => {
    toast({
      title: "Edit Student",
      description: `Editing student with ID: ${id}`,
    });
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter((student) => student.id !== id));
    toast({
      title: "Student deleted",
      description: "The student has been deleted successfully.",
    });
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.additionalInfo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateExam = () => {
    toast({
      title: "Create Exam",
      description: "Redirecting to exam creation page",
    });
    // In a real app, this would navigate to the exam creation page
  };

  const handleMonitorExam = (id: string) => {
    toast({
      title: "Monitor Exam",
      description: `Monitoring exam with ID: ${id}`,
    });
    // In a real app, this would navigate to the exam monitoring page
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4 space-y-6">
          <div className="dashboard-grid">
            <StatsCard
              title="Total Students"
              value={students.length}
              description="Registered students"
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Upcoming Exams"
              value={exams.filter(e => e.status === "scheduled").length}
              description="Scheduled exam sessions"
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatsCard
              title="Cheating Alerts"
              value="0"
              description="No alerts detected"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Upcoming Exams</CardTitle>
                  <CardDescription>Scheduled exam sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {exams.filter(e => e.status === "scheduled").length > 0 ? (
                      exams.filter(e => e.status === "scheduled").map(exam => (
                        <div key={exam.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                          <div>
                            <div className="font-medium">{exam.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(exam.date).toLocaleDateString()} • {exam.time} • {exam.duration} minutes
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleMonitorExam(exam.id)}>
                            Monitor
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No upcoming exams scheduled.</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full" onClick={handleCreateExam}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Exam
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="students" className="pt-4 space-y-6">
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
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Create a new student account with a unique registration number.
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
                    <Button onClick={handleAddStudent}>Add Student</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <UserCard
                  key={student.id}
                  id={student.id}
                  name={student.name}
                  email={student.email}
                  role="student"
                  status={student.status}
                  additionalInfo={student.additionalInfo}
                  onView={handleViewStudent}
                  onEdit={handleEditStudent}
                  onDelete={handleDeleteStudent}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No students found. Add a new student to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="exams" className="pt-4 space-y-6">
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
              <Button onClick={handleCreateExam}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{exam.title}</CardTitle>
                    <Badge 
                      variant={exam.status === "active" ? "default" : "secondary"}
                      className={
                        exam.status === "active" 
                          ? "bg-exam-success" 
                          : exam.status === "scheduled" 
                          ? "bg-exam-primary" 
                          : "bg-muted"
                      }
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
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" onClick={() => handleMonitorExam(exam.id)}>
                    <Search className="h-4 w-4 mr-1" />
                    Monitor
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {exams.length === 0 && (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No exams found. Create a new exam to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
