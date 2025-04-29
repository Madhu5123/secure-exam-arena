import { useState, useEffect } from "react";
import { PlusCircle, FileText, Search, Image, BookOpen, Users, Edit, Trash2 } from "lucide-react";
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
import { getExamsForTeacher, createExam, getTopStudents, Exam, updateExam, deleteExam } from "@/services/ExamService";
import { uploadToCloudinary } from "@/utils/CloudinaryUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchAcademicData } from "@/services/AcademicService";
import { useNavigate } from "react-router-dom";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

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
  const [examStartDate, setExamStartDate] = useState("");
  const [examEndDate, setExamEndDate] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isCreateExamDialogOpen, setIsCreateExamDialogOpen] = useState(false);
  const [isEditExamDialogOpen, setIsEditExamDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
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
  const [teacherDepartment, setTeacherDepartment] = useState("");
  const [availableSubjectsForSemester, setAvailableSubjectsForSemester] = useState<string[]>([]);
  const [minScoreToPass, setMinScoreToPass] = useState(0);
  const [warningsThreshold, setWarningsThreshold] = useState(3);
  const { toast } = useToast();
  const navigate = useNavigate();

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

    const fetchTeacherDepartment = async () => {
      const user = localStorage.getItem('examUser');
      if (user) {
        const userData = JSON.parse(user);
        const teacherRef = ref(db, `users/${userData.id}`);
        onValue(teacherRef, (snapshot) => {
          if (snapshot.exists()) {
            const teacherData = snapshot.val();
            console.log("Teacher data:", teacherData);
            setTeacherDepartment(teacherData.department || '');
          }
        });
      }
    };

    fetchTeacherDepartment();
    
    return () => {
      unsubscribeStudents();
      examsCleanup();
    };
  }, []);

  useEffect(() => {
    const loadAcademicData = async () => {
      if (teacherDepartment) {
        console.log("Loading academic data for department:", teacherDepartment);
        const data = await fetchAcademicData(teacherDepartment);
        console.log("Academic data received:", data);
        setAvailableSemesters(["All", ...data.semesters]);
        setAvailableSubjectsAll(["All", ...data.subjects]);
        setSubjectsBySemester(data.subjectsBySemester || {});
      }
    };

    loadAcademicData();
  }, [teacherDepartment]);

  useEffect(() => {
    if (examSemester && subjectsBySemester[examSemester]) {
      console.log(`Setting subjects for semester ${examSemester}:`, subjectsBySemester[examSemester]);
      setAvailableSubjectsForSemester(subjectsBySemester[examSemester]);
      setExamSubject(""); // Reset subject when semester changes
    } else {
      setAvailableSubjectsForSemester([]);
    }
  }, [examSemester, subjectsBySemester]);

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

  const handleAddSection = () => {
    const newSectionId = `section-${examSections.length + 1}`;
    const newSectionName = `Section ${examSections.length + 1}`;
    setExamSections([...examSections, { id: newSectionId, name: newSectionName, timeLimit: 30, questions: [] }]);
  };

  const handleSectionTimeLimitChange = (index: number, timeLimit: number) => {
    const updatedSections = [...examSections];
    updatedSections[index].timeLimit = timeLimit;
    setExamSections(updatedSections);
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text) {
      toast({
        title: "Incomplete question",
        description: "Please add question text",
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion.type === "multiple-choice") {
      if (!currentQuestion.options?.every(option => option.trim())) {
        toast({
          title: "Incomplete options",
          description: "Please fill in all options",
          variant: "destructive"
        });
        return;
      }
      if (!currentQuestion.correctAnswer) {
        toast({
          title: "Missing correct answer",
          description: "Please select the correct answer",
          variant: "destructive"
        });
        return;
      }
    }

    setQuestions([...questions, { ...currentQuestion }]);
    
    const updatedSections = [...examSections];
    const currentSectionIndex = updatedSections.findIndex(s => s.name === currentSection);
    
    if (currentSectionIndex !== -1) {
      if (!updatedSections[currentSectionIndex].questions) {
        updatedSections[currentSectionIndex].questions = [];
      }
      updatedSections[currentSectionIndex].questions.push({ ...currentQuestion });
      setExamSections(updatedSections);
    }
    
    const newId = String(questions.length + 2);
    setCurrentQuestion({
      id: newId,
      type: "multiple-choice",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      section: currentSection,
      timeLimit: 5
    });

    toast({
      title: "Question added",
      description: `Question ${questions.length + 1} added to ${currentSection}`,
    });
  };

  const handleQuestionTypeChange = (type: "multiple-choice" | "short-answer") => {
    let newQuestion = { ...currentQuestion, type };
    
    if (type === "multiple-choice") {
      newQuestion.options = ["", "", "", ""];
      newQuestion.correctAnswer = "";
    } else {
      delete newQuestion.options;
      newQuestion.correctAnswer = "";
    }
    
    setCurrentQuestion(newQuestion);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleEditStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const studentWithId: StudentData = {
        id: student.id,
        name: student.name,
        email: student.email,
        regNumber: student.regNumber || "",
        password: "",
        photo: student.photo || "",
        semester: student.semester || "Semester 1"
      };
      
      setNewStudent(studentWithId);
      setIsAddStudentDialogOpen(true);
    }
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

  const calculateMaxScore = () => {
    return questions.reduce((total, question) => total + question.points, 0);
  };

  const handleSaveExam = async () => {
    try {
      if (!examTitle || !examSubject || !examDuration) {
        toast({
          title: "Missing information",
          description: "Please fill in all required exam details",
          variant: "destructive"
        });
        setActiveTab("details");
        return;
      }

      if (!examStartDate || !examEndDate) {
        toast({
          title: "Missing dates",
          description: "Please set both start and end dates for the exam",
          variant: "destructive"
        });
        return;
      }

      const startDate = new Date(examStartDate);
      const endDate = new Date(examEndDate);
      
      if (startDate >= endDate) {
        toast({
          title: "Invalid dates",
          description: "End date must be after start date",
          variant: "destructive"
        });
        return;
      }

      if (questions.length === 0) {
        toast({
          title: "No questions",
          description: "Please add at least one question to the exam",
          variant: "destructive"
        });
        setActiveTab("questions");
        return;
      }

      if (selectedStudents.length === 0) {
        toast({
          title: "No students assigned",
          description: "Please assign this exam to at least one student",
          variant: "destructive"
        });
        setActiveTab("students");
        return;
      }

      const user = localStorage.getItem('examUser');
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please login again",
          variant: "destructive"
        });
        return;
      }

      const userData = JSON.parse(user);
      
      const formattedSections = examSections.map(section => {
        const sectionQuestions = questions.filter(q => q.section === section.name);
        return {
          id: section.id,
          name: section.name,
          timeLimit: section.timeLimit,
          questions: sectionQuestions
        };
      });
      
      const examData = {
        title: examTitle,
        subject: examSubject,
        semester: examSemester,
        createdBy: userData.id,
        duration: Number(examDuration),
        status: "scheduled" as "draft" | "scheduled" | "active" | "completed" | "expired",
        questions: questions,
        assignedStudents: selectedStudents,
        sections: formattedSections,
        startDate: examStartDate,
        endDate: examEndDate,
        department: teacherDepartment,
        minScoreToPass: Number(minScoreToPass),
        maxScore: calculateMaxScore(),
        warningsThreshold: Number(warningsThreshold)
      };

      const result = await createExam(examData);
      
      if (result.success) {
        toast({
          title: "Exam created",
          description: "The exam has been created and assigned successfully",
        });
        
        setExamTitle("");
        setExamSubject("");
        setExamDuration("60");
        setExamStartDate("");
        setExamEndDate("");
        setQuestions([]);
        setSelectedStudents([]);
        setExamSections([{ id: "section-1", name: "Section 1", timeLimit: 30, questions: [] }]);
        setIsCreateExamDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create exam",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: "Failed to create exam. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateExam = async () => {
    if (!currentExam) return;
    
    try {
      // Extract updated exam data from the form fields
      const updatedExamData = {
        title: examTitle,
        subject: examSubject,
        semester: examSemester,
        duration: Number(examDuration),
        startDate: examStartDate,
        endDate: examEndDate,
        minScoreToPass: Number(minScoreToPass),
        warningsThreshold: Number(warningsThreshold)
      };
      
      // Update the exam
      const result = await updateExam(currentExam.id, updatedExamData);
      
      if (result.success) {
        toast({
          title: "Exam updated",
          description: "The exam has been updated successfully",
        });
        
        setIsEditExamDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update exam",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating exam:", error);
      toast({
        title: "Error",
        description: "Failed to update exam. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmDeleteExam = async () => {
    if (!currentExam) return;
    
    try {
      const result = await deleteExam(currentExam.id);
      
      if (result.success) {
        toast({
          title: "Exam deleted",
          description: "The exam has been deleted successfully",
        });
        
        setIsDeleteDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete exam",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "Failed to delete exam. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditExam = (exam: Exam) => {
    setCurrentExam(exam);
    setExamTitle(exam.title);
    setExamSubject(exam.subject || "");
    setExamSemester(exam.semester || "Semester 1");
    setExamDuration(exam.duration.toString());
    setExamStartDate(exam.startDate);
    setExamEndDate(exam.endDate);
    setMinScoreToPass(exam.minScoreToPass);
    setWarningsThreshold(exam.warningsThreshold);
    setIsEditExamDialogOpen(true);
  };

  const handleDeleteExam = (exam: Exam) => {
    setCurrentExam(exam);
    setIsDeleteDialogOpen(true);
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(
      selectedStudents.includes(studentId)
        ? selectedStudents.filter(id => id !== studentId)
        : [...selectedStudents, studentId]
    );
  };

  const handleSelectAllStudents = (semesterFilter: string) => {
    const semesterStudents = students
      .filter(student => semesterFilter === "All" || student.semester === semesterFilter)
      .map(student => student.id);
    
    if (selectedStudents.length === semesterStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(semesterStudents);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.regNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester = selectedSemester === "All" || student.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  const getSubjectsForSemester = () => {
    if (selectedSemester === "All") {
      const allSubjects = exams.map(e => e.subject);
      return ["All", ...Array.from(new Set(allSubjects.filter(Boolean)))];
    } else {
      const filtered = exams.filter(e => e.semester === selectedSemester);
      const subjs = filtered.map(e => e.subject);
      return ["All", ...Array.from(new Set(subjs.filter(Boolean)))];
    }
  };

  const availableSubjects = getSubjectsForSemester();

  useEffect(() => {
    if (!availableSubjects.includes(selectedSubject)) {
      setSelectedSubject("All");
    }
    // eslint-disable-next-line
  }, [selectedSemester, exams]);

  const filteredExams = exams.filter((exam) => {
    const bySemester = selectedSemester === "All" || exam.semester === selectedSemester;
    const bySubject = selectedSubject === "All" || exam.subject === selectedSubject;
    return bySemester && bySubject;
  });

  const totalStudents = selectedSemester === "All" ? students.length : students.filter(s => s.semester === selectedSemester).length;
  const activeStudents = filteredStudents.filter(s => s.status === "active").length;
  const totalExams = filteredExams.length;
  const totalAttended = filteredExams.reduce((sum, exam) => sum + (Array.isArray(exam.submissions) ? exam.submissions.length : exam.attendance || 0), 0);
  const studentsPassed = filteredStudents.filter(s => s.result === "passed").length;

  const getSubjectExamsCount = () => {
    const groupSubjects = availableSubjects.slice(1);
    return groupSubjects.map(subject => {
      const count = exams.filter(e => 
        (selectedSemester === "All" || e.semester === selectedSemester) && 
        e.subject === subject
      ).length;
      return { subject, count };
    });
  };

  const subjectData = getSubjectExamsCount();

  const handleMonitorExam = (examId: string) => {
    navigate(`/exam/monitor/${examId}`);
  };

  const renderManageExams = () => {
    return (
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
            <Dialog open={isCreateExamDialogOpen} onOpenChange={setIsCreateExamDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Exam</DialogTitle>
                  <DialogDescription>
                    Create a new exam with sections, questions and assign to students
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Exam Details</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="students">Assign Students</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="pt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="examTitle">Exam Title</Label>
                        <Input
                          id="examTitle"
                          value={examTitle}
                          onChange={(e) => setExamTitle(e.target.value)}
                          placeholder="e.g. Mid-term Mathematics"
                        />
                      </div>
                       
                      <div className="grid gap-2">
                        <Label htmlFor="examSemester">Semester</Label>
                        <Select value={examSemester} onValueChange={setExamSemester}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSemesters.slice(1).map(semester => (
                              <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="examSubject">Subject</Label>
                        <Select value={examSubject} onValueChange={setExamSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubjectsAll.slice(1).map(subject => (
                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="examDuration">Total Duration (minutes)</Label>
                        <Input
                          id="examDuration"
                          type="number"
                          min="1"
                          value={examDuration}
                          onChange={(e) => setExamDuration(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="examStartDate">Start Date</Label>
                        <Input
                          id="examStartDate"
                          type="datetime-local"
                          value={examStartDate}
                          onChange={(e) => setExamStartDate(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="examEndDate">End Date</Label>
                        <Input
                          id="examEndDate"
                          type="datetime-local"
                          value={examEndDate}
                          onChange={(e) => setExamEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Label className="text-lg font-medium mb-2 block">Exam Sections</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create sections with separate time limits
                      </p>
                      
                      <div className="space-y-4">
                        {examSections.map((section, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 border rounded-md">
                            <div className="font-medium flex-1">{section.name}</div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`section-time-${index}`} className="text-sm whitespace-nowrap">
                                Time limit (min):
                              </Label>
                              <Input
                                id={`section-time-${index}`}
                                type="number"
                                min="1"
                                value={section.timeLimit}
                                onChange={(e) => handleSectionTimeLimitChange(index, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button onClick={handleAddSection} className="mt-3" variant="outline">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreateExamDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setActiveTab("questions")}>
                        Next: Add Questions
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="questions" className="pt-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Current Questions ({questions.length})</h2>
                        <div>
                          <Label htmlFor="questionSection" className="mr-2">Section:</Label>
                          <select 
                            id="questionSection"
                            value={currentSection}
                            onChange={(e) => setCurrentSection(e.target.value)}
                            className="border rounded px-2 py-1 bg-background"
                          >
                            {examSections.map((section) => (
                              <option key={section.name} value={section.name}>
                                {section.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {questions.length > 0 ? (
                        <div className="space-y-4">
                          {questions.map((question, index) => (
                            <Card key={question.id}>
                              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                                <div>
                                  <CardTitle className="text-base">Question {index + 1}</CardTitle>
                                  <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span className="uppercase">{question.type}</span>
                                    <span>•</span>
                                    <span>{question.section}</span>
                                    <span>•</span>
                                    <span>{question.points} {question.points === 1 ? "point" : "points"}</span>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                  onClick={() => setQuestions(questions.filter(q => q.id !== question.id))}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </CardHeader>
                              <CardContent>
                                <p className="font-medium">{question.text}</p>
                                
                                {question.type === "multiple-choice" && (
                                  <div className="mt-2 space-y-1">
                                    {question.options?.map((option, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                                          question.correctAnswer === String(i) ? "bg-primary text-white" : "border"
                                        }`}>
                                          {question.correctAnswer === String(i) && "✓"}
                                        </div>
                                        <span>{option}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {question.type === "short-answer" && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    Answer: {question.correctAnswer}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="p-6 text-center text-muted-foreground">
                          <p>No questions added yet. Add your first question below.</p>
                        </Card>
                      )}
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Add New Question to {currentSection}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="questionType">Question Type</Label>
                          <Select 
                            value={currentQuestion.type} 
                            onValueChange={(val) => handleQuestionTypeChange(val as "multiple-choice" | "short-answer")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                              <SelectItem value="short-answer">Short Answer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="questionText">Question Text</Label>
                          <Textarea
                            id="questionText"
                            value={currentQuestion.text}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                            placeholder="Enter your question text"
                          />
                        </div>
                        {currentQuestion.type === "multiple-choice" && (
                          <div className="grid gap-2">
                            <Label htmlFor="questionOptions">Options</Label>
                            <div className="grid gap-2">
                              {currentQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                    onClick={() => setCurrentQuestion({ ...currentQuestion, options: currentQuestion.options.filter((_, i) => i !== index) })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, ""] })}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {currentQuestion.type === "short-answer" && (
                          <div className="grid gap-2">
                            <Label htmlFor="questionCorrectAnswer">Correct Answer</Label>
                            <Input
                              id="questionCorrectAnswer"
                              value={currentQuestion.correctAnswer}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                            />
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="questionPoints">Points</Label>
                          <Input
                            id="questionPoints"
                            type="number"
                            min="1"
                            value={currentQuestion.points}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={handleAddQuestion} className="w-full">Add Question</Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="students" className="pt-6 space-y-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="studentFilter">Filter by Semester</Label>
                        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSemesters.map((semester) => (
                              <SelectItem key={semester} value={semester}>
                                {semester}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="studentFilter">Filter by Subject</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubjects.map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {filteredStudents.map((student) => (
                        <div key={student.id} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Image
                                src={student.photo || ""}
                                alt={student.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="text-lg font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => handleStudentSelection(student.id)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => handleSelectAllStudents(selectedSemester)}>
                        {selectedStudents.length === filteredStudents.length ? "Unselect All" : "Select All"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            
            {/* Edit Exam Dialog */}
            <Dialog open={isEditExamDialogOpen} onOpenChange={setIsEditExamDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Exam</DialogTitle>
                  <DialogDescription>
                    Update the exam details
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="editExamTitle">Exam Title</Label>
                      <Input
                        id="editExamTitle"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder="e.g. Mid-term Mathematics"
                      />
                    </div>
                     
                    <div className="grid gap-2">
                      <Label htmlFor="editExamSemester">Semester</Label>
                      <Select value={examSemester} onValueChange={setExamSemester}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSemesters.slice(1).map(semester => (
                            <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="editExamSubject">Subject</Label>
                      <Select value={examSubject} onValueChange={setExamSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjectsAll.slice(1).map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="editExamDuration">Total Duration (minutes)</Label>
                      <Input
                        id="editExamDuration"
                        type="number"
                        min="1"
                        value={examDuration}
                        onChange={(e) => setExamDuration(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="editExamStartDate">Start Date</Label>
                      <Input
                        id="editExamStartDate"
                        type="datetime-local"
                        value={examStartDate}
                        onChange={(e) => setExamStartDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="editExamEndDate">End Date</Label>
                      <Input
                        id="editExamEndDate"
                        type="datetime-local"
                        value={examEndDate}
                        onChange={(e) => setExamEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="editMinScoreToPass">Minimum Score to Pass (%)</Label>
                      <Input
                        id="editMinScoreToPass"
                        type="number"
                        min="0"
                        max="100"
                        value={minScoreToPass}
                        onChange={(e) => setMinScoreToPass(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="editWarningsThreshold">Warnings Threshold</Label>
                      <Input
                        id="editWarningsThreshold"
                        type="number"
                        min="1"
                        value={warningsThreshold}
                        onChange={(e) => setWarningsThreshold(parseInt(e.target.value) || 3)}
                      />
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditExamDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateExam}>
                    Update Exam
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Confirm Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the exam "{currentExam?.title}". 
                    This action cannot be undone if the exam has no submissions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDeleteExam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="overflow-hidden">
            <CardHeader className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exams</CardTitle>
                  <CardDescription>Manage your created exams</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSemesters.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-3 font-medium">Title</th>
                      <th className="p-3 font-medium">Subject</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.length > 0 ? (
                      filteredExams.map((exam) => (
                        <tr key={exam.id} className="border-t">
                          <td className="p-3 font-medium">{exam.title}</td>
                          <td className="p-3">{exam.subject}</td>
                          <td className="p-3">
                            <Badge variant={
                              exam.status === "completed" ? "outline" :
                              exam.status === "active" ? "default" :
                              exam.status === "scheduled" ? "secondary" :
                              "destructive"
                            }>
                              {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {new Date(exam.startDate).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditExam(exam)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMonitorExam(exam.id)}
                              >
                                Monitor
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteExam(exam)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          No exams found. Create your first exam to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return renderManageExams();
}
