
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon, InfoIcon, Plus, Trash2, FileEdit, ArrowRight, Search } from "lucide-react";
import { createExam } from "@/services/ExamService";
import { useToast } from "@/hooks/use-toast";

// Constants for the subjects based on semester
const SUBJECTS_BY_SEMESTER = {
  "Semester 1": ["Mathematics I", "Physics I", "Computer Fundamentals", "English", "Engineering Drawing"],
  "Semester 2": ["Mathematics II", "Physics II", "Chemistry", "Programming Basics", "Environmental Science"],
  "Semester 3": ["Data Structures", "Digital Electronics", "Database Systems", "Computer Architecture", "Discrete Mathematics"],
  "Semester 4": ["Algorithms", "Operating Systems", "Software Engineering", "Web Development", "Computer Networks"],
  "Semester 5": ["Artificial Intelligence", "Machine Learning", "Computer Graphics", "Information Security", "Cloud Computing"],
  "Semester 6": ["Data Mining", "Mobile App Development", "Computer Vision", "Natural Language Processing", "IoT Systems"],
  "Semester 7": ["Blockchain Technology", "Big Data Analytics", "Cryptography", "Quantum Computing", "Robotics"],
  "Semester 8": ["Advanced AI", "Network Security", "Parallel Computing", "Project Management", "Ethics in Computing"]
};

interface ManageExamsProps {
  section?: string;
}

export function ManageExams({ section }: ManageExamsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "create" | "manage">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("Semester 1");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState<Date | undefined>(new Date());
  const [examTime, setExamTime] = useState("09:00");
  const [examDuration, setExamDuration] = useState("60");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "multiple-choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: "1"
  });
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Add this state to track analytics data
  const [analytics, setAnalytics] = useState({
    totalExams: 0,
    examsAttended: 0,
    studentsPassed: 0
  });

  useEffect(() => {
    // Initialize with first subject from the selected semester
    if (SUBJECTS_BY_SEMESTER[selectedSemester]?.length > 0) {
      setSelectedSubject(SUBJECTS_BY_SEMESTER[selectedSemester][0]);
    }
    
    // Mock data for students
    setAvailableStudents([
      { id: "1", name: "Alice Johnson", regNumber: "CS2023001", semester: selectedSemester },
      { id: "2", name: "Bob Smith", regNumber: "CS2023002", semester: selectedSemester },
      { id: "3", name: "Charlie Brown", regNumber: "CS2023003", semester: selectedSemester },
      { id: "4", name: "Diana Prince", regNumber: "CS2023004", semester: selectedSemester },
      { id: "5", name: "Edward Norton", regNumber: "CS2023005", semester: selectedSemester }
    ]);

    // Mock data for exams with the selected subject filter
    const mockExams = [
      { 
        id: "1", 
        title: "Midterm Examination", 
        subject: "Mathematics I", 
        semester: "Semester 1", 
        date: "2023-04-15", 
        time: "09:00", 
        duration: 120, 
        status: "completed", 
        students: 45, 
        averageScore: 78 
      },
      { 
        id: "2", 
        title: "Final Examination", 
        subject: "Physics I", 
        semester: "Semester 1", 
        date: "2023-05-20", 
        time: "10:30", 
        duration: 180, 
        status: "scheduled", 
        students: 42, 
        averageScore: null 
      },
      { 
        id: "3", 
        title: "Quiz 1", 
        subject: "Computer Fundamentals", 
        semester: "Semester 1", 
        date: "2023-03-10", 
        time: "14:00", 
        duration: 45, 
        status: "completed", 
        students: 40, 
        averageScore: 82 
      },
      { 
        id: "4", 
        title: "Quiz 2", 
        subject: "English", 
        semester: "Semester 1", 
        date: "2023-04-05", 
        time: "11:15", 
        duration: 60, 
        status: "completed", 
        students: 38, 
        averageScore: 75 
      },
      { 
        id: "5", 
        title: "Practical Exam", 
        subject: "Engineering Drawing", 
        semester: "Semester 1", 
        date: "2023-05-05", 
        time: "09:00", 
        duration: 150, 
        status: "scheduled", 
        students: 41, 
        averageScore: null 
      },
      { 
        id: "6", 
        title: "Midterm Examination", 
        subject: "Data Structures", 
        semester: "Semester 3", 
        date: "2023-04-18", 
        time: "09:00", 
        duration: 120, 
        status: "completed", 
        students: 38, 
        averageScore: 72 
      },
      { 
        id: "7", 
        title: "Quiz 1", 
        subject: "Operating Systems", 
        semester: "Semester 4", 
        date: "2023-03-22", 
        time: "14:00", 
        duration: 45, 
        status: "completed", 
        students: 36, 
        averageScore: 68 
      }
    ];

    // Filter exams based on selected semester and subject
    const filteredExams = mockExams.filter(exam => 
      exam.semester === selectedSemester && 
      (selectedSubject === "" || exam.subject === selectedSubject) &&
      (searchQuery === "" || 
       exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       exam.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setExams(filteredExams);

    // Update analytics based on the filtered exams
    const totalExams = filteredExams.length;
    const attendedExams = filteredExams.filter(exam => exam.status === "completed").length;
    const passedStudents = filteredExams
      .filter(exam => exam.status === "completed" && exam.averageScore !== null && exam.averageScore >= 60)
      .reduce((total, exam) => {
        // Assuming 60% of students pass if average score is above passing mark
        return total + Math.round(exam.students * 0.6);
      }, 0);

    setAnalytics({
      totalExams,
      examsAttended: attendedExams,
      studentsPassed: passedStudents
    });
    
  }, [selectedSemester, selectedSubject, searchQuery]);

  useEffect(() => {
    // Set active tab based on the section prop
    if (section) {
      switch (section) {
        case "create":
          setActiveTab("create");
          break;
        case "manage":
          setActiveTab("manage");
          break;
        default:
          setActiveTab("overview");
      }
    }
  }, [section]);

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    // Reset subject when semester changes
    if (SUBJECTS_BY_SEMESTER[value]?.length > 0) {
      setSelectedSubject(SUBJECTS_BY_SEMESTER[value][0]);
    } else {
      setSelectedSubject("");
    }
  };

  const handleAddQuestion = () => {
    if (currentQuestion.text.trim() === "") {
      toast({
        title: "Error",
        description: "Question text cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion.type === "multiple-choice" && 
        (!currentQuestion.options.every(option => option.trim() !== "") || 
         currentQuestion.correctAnswer.trim() === "")) {
      toast({
        title: "Error",
        description: "All options must be filled and correct answer must be selected.",
        variant: "destructive"
      });
      return;
    }

    if (editingQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = {...currentQuestion};
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
    } else {
      // Add new question
      setQuestions([...questions, {...currentQuestion}]);
    }

    // Reset current question
    setCurrentQuestion({
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: "1"
    });
    setIsAddingQuestion(false);
  };

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion({...questions[index]});
    setEditingQuestionIndex(index);
    setIsAddingQuestion(true);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({...currentQuestion, options: updatedOptions});
  };

  const handleCreateExam = async () => {
    if (!examTitle.trim()) {
      toast({
        title: "Error",
        description: "Exam title is required.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSubject) {
      toast({
        title: "Error",
        description: "Please select a subject.",
        variant: "destructive"
      });
      return;
    }

    if (!examDate) {
      toast({
        title: "Error",
        description: "Exam date is required.",
        variant: "destructive"
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "At least one question is required.",
        variant: "destructive"
      });
      return;
    }

    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student.",
        variant: "destructive"
      });
      return;
    }

    // Format date for submission
    const formattedDate = format(examDate, "yyyy-MM-dd");

    const examData = {
      title: examTitle,
      subject: selectedSubject,
      semester: selectedSemester,
      createdBy: "teacher_id", // This would come from authentication
      date: formattedDate,
      time: examTime,
      duration: parseInt(examDuration),
      status: "scheduled" as const,
      questions: questions.map(q => ({
        ...q,
        points: parseInt(q.points)
      })),
      assignedStudents: selectedStudents
    };

    try {
      const result = await createExam(examData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Exam created successfully!",
        });
        
        // Reset form
        setExamTitle("");
        setExamDate(new Date());
        setExamTime("09:00");
        setExamDuration("60");
        setQuestions([]);
        setSelectedStudents([]);
        
        // Switch to manage tab
        setActiveTab("manage");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create exam.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExam = (examId: string) => {
    setExamToDelete(examId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteExam = () => {
    // Here you would call your API to delete the exam
    // For now, we'll just update the state
    setExams(exams.filter(exam => exam.id !== examToDelete));
    setIsDeleteDialogOpen(false);
    setExamToDelete(null);
    
    toast({
      title: "Success",
      description: "Exam deleted successfully!",
    });
  };

  const renderOverviewTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-primary">Exam Dashboard</h2>
            <p className="text-muted-foreground">Manage your exams and monitor student performance</p>
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedSemester} onValueChange={handleSemesterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(SUBJECTS_BY_SEMESTER).map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS_BY_SEMESTER[selectedSemester]?.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-primary">Total Exams</CardTitle>
              <CardDescription>All exams for selected subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{analytics.totalExams}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Created for {selectedSubject || "all subjects"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-primary">Exams Conducted</CardTitle>
              <CardDescription>Completed examinations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{analytics.examsAttended}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {((analytics.examsAttended / analytics.totalExams) * 100 || 0).toFixed(0)}% completion rate
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-primary">Students Passed</CardTitle>
              <CardDescription>Success rate analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{analytics.studentsPassed}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Average pass rate: 72%
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Exams Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Exams</h3>
          <div className="space-y-4">
            {exams.slice(0, 4).map(exam => (
              <Card key={exam.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-3/4 p-4">
                    <h4 className="font-semibold text-lg">{exam.title}</h4>
                    <p className="text-sm text-muted-foreground">{exam.subject} • {exam.semester}</p>
                    <div className="flex items-center gap-x-2 mt-2">
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        {exam.date} at {exam.time}
                      </div>
                      <div className="text-sm">
                        Duration: {exam.duration} mins
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/4 flex items-center justify-end p-4 bg-slate-50/50">
                    <div className="flex flex-col items-end gap-2">
                      {exam.status === "completed" ? (
                        <Badge className="px-3 py-1 bg-green-500 text-white">Completed</Badge>
                      ) : (
                        <Badge className="px-3 py-1 bg-blue-500 text-white">Scheduled</Badge>
                      )}
                      {exam.status === "completed" && (
                        <div className="text-sm font-medium">Avg: {exam.averageScore}%</div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full flex justify-center items-center gap-2"
              onClick={() => setActiveTab("manage")}
            >
              View All Exams <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button 
            className="flex-1 py-6 flex flex-col gap-2" 
            onClick={() => setActiveTab("create")}
          >
            <Plus className="h-5 w-5" />
            <span>Create New Exam</span>
          </Button>
          <Button 
            className="flex-1 py-6 flex flex-col gap-2" 
            variant="outline"
            onClick={() => setActiveTab("manage")}
          >
            <FileEdit className="h-5 w-5" />
            <span>Manage Exams</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderCreateTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-primary">Create New Exam</h2>
          <p className="text-muted-foreground">Set up a new examination for your students</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Exam Details</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="examTitle" className="block text-sm font-medium mb-1">
                    Exam Title
                  </label>
                  <Input
                    id="examTitle"
                    placeholder="e.g., Midterm Examination"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="examSemester" className="block text-sm font-medium mb-1">
                      Semester
                    </label>
                    <Select value={selectedSemester} onValueChange={handleSemesterChange}>
                      <SelectTrigger id="examSemester">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(SUBJECTS_BY_SEMESTER).map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="examSubject" className="block text-sm font-medium mb-1">
                      Subject
                    </label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger id="examSubject">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS_BY_SEMESTER[selectedSemester]?.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Exam Date
                    </label>
                    <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {examDate ? format(examDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={examDate}
                          onSelect={(date) => {
                            setExamDate(date);
                            setIsDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label htmlFor="examTime" className="block text-sm font-medium mb-1">
                      Start Time
                    </label>
                    <Input
                      id="examTime"
                      type="time"
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="examDuration" className="block text-sm font-medium mb-1">
                    Duration (minutes)
                  </label>
                  <Input
                    id="examDuration"
                    type="number"
                    min="10"
                    max="300"
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Assign Students</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {availableStudents.length > 0 ? (
                    availableStudents.map(student => (
                      <div key={student.id} className="flex items-center mb-2">
                        <input 
                          type="checkbox"
                          id={`student-${student.id}`}
                          className="mr-2 rounded text-primary focus:ring-primary"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <label htmlFor={`student-${student.id}`} className="flex-1">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-sm text-muted-foreground block">{student.regNumber}</span>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No students available for the selected semester</p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Selected {selectedStudents.length} of {availableStudents.length} students
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Questions</h3>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setIsAddingQuestion(true);
                      setEditingQuestionIndex(null);
                      setCurrentQuestion({
                        text: "",
                        type: "multiple-choice",
                        options: ["", "", "", ""],
                        correctAnswer: "",
                        points: "1"
                      });
                    }}
                  >
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingQuestionIndex !== null ? "Edit Question" : "Add New Question"}
                    </DialogTitle>
                    <DialogDescription>
                      Create a question for your exam. Configure the question type, options, and correct answer.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div>
                      <label htmlFor="questionText" className="block text-sm font-medium mb-1">
                        Question Text
                      </label>
                      <Input
                        id="questionText"
                        value={currentQuestion.text}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                        placeholder="Enter your question here"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="questionType" className="block text-sm font-medium mb-1">
                          Question Type
                        </label>
                        <Select 
                          value={currentQuestion.type}
                          onValueChange={(value) => setCurrentQuestion({...currentQuestion, type: value})}
                        >
                          <SelectTrigger id="questionType">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                            <SelectItem value="true-false">True/False</SelectItem>
                            <SelectItem value="short-answer">Short Answer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label htmlFor="questionPoints" className="block text-sm font-medium mb-1">
                          Points
                        </label>
                        <Input
                          id="questionPoints"
                          type="number"
                          min="1"
                          max="20"
                          value={currentQuestion.points}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, points: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    {currentQuestion.type === "multiple-choice" && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">
                          Options
                        </label>
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                            />
                            <input 
                              type="radio"
                              name="correctAnswer"
                              checked={currentQuestion.correctAnswer === option}
                              onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: option})}
                              className="ml-2"
                            />
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          Select the radio button next to the correct answer
                        </p>
                      </div>
                    )}
                    
                    {currentQuestion.type === "true-false" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Correct Answer
                        </label>
                        <div className="flex gap-4">
                          <div className="flex items-center">
                            <input 
                              type="radio"
                              id="answerTrue"
                              name="tfAnswer"
                              value="True"
                              checked={currentQuestion.correctAnswer === "True"}
                              onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: "True"})}
                              className="mr-2"
                            />
                            <label htmlFor="answerTrue">True</label>
                          </div>
                          <div className="flex items-center">
                            <input 
                              type="radio"
                              id="answerFalse"
                              name="tfAnswer"
                              value="False"
                              checked={currentQuestion.correctAnswer === "False"}
                              onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: "False"})}
                              className="mr-2"
                            />
                            <label htmlFor="answerFalse">False</label>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {currentQuestion.type === "short-answer" && (
                      <div>
                        <label htmlFor="shortAnswerKey" className="block text-sm font-medium mb-1">
                          Answer Key
                        </label>
                        <Input
                          id="shortAnswerKey"
                          value={currentQuestion.correctAnswer}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value})}
                          placeholder="Enter the expected answer"
                        />
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button onClick={handleAddQuestion}>
                      {editingQuestionIndex !== null ? "Update Question" : "Add Question"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-4">
              {questions.length > 0 ? (
                questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">Question {index + 1}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {question.points} {parseInt(question.points) === 1 ? "point" : "points"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditQuestion(index)}
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2">{question.text}</p>
                    
                    {question.type === "multiple-choice" && (
                      <div className="mt-3 space-y-1">
                        {question.options.map((option, i) => (
                          <div key={i} className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center
                              ${option === question.correctAnswer ? "bg-primary border-primary" : "border-gray-300"}`}>
                              {option === question.correctAnswer && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.type === "true-false" && (
                      <div className="mt-3 flex gap-4">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border mr-2 
                            ${question.correctAnswer === "True" ? "bg-primary border-primary" : "border-gray-300"}`}>
                            {question.correctAnswer === "True" && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span>True</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border mr-2 
                            ${question.correctAnswer === "False" ? "bg-primary border-primary" : "border-gray-300"}`}>
                            {question.correctAnswer === "False" && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span>False</span>
                        </div>
                      </div>
                    )}
                    
                    {question.type === "short-answer" && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground">
                          Expected answer: <span className="font-medium">{question.correctAnswer}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="border border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">No questions added yet</p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsAddingQuestion(true);
                      setEditingQuestionIndex(null);
                    }}
                  >
                    Add Your First Question
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setActiveTab("overview")}>
            Cancel
          </Button>
          <Button onClick={handleCreateExam}>
            Create Exam
          </Button>
        </div>
      </div>
    );
  };

  const renderManageTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-primary">Manage Exams</h2>
            <p className="text-muted-foreground">View, edit and monitor all your examinations</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                className="pl-10 w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button onClick={() => setActiveTab("create")}>
              <Plus className="mr-2 h-4 w-4" />
              New Exam
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select value={selectedSemester} onValueChange={handleSemesterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Semester" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(SUBJECTS_BY_SEMESTER).map((semester) => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Subjects</SelectItem>
              {SUBJECTS_BY_SEMESTER[selectedSemester]?.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          {exams.length > 0 ? (
            exams.map(exam => (
              <Card key={exam.id} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 p-6">
                    <h3 className="text-xl font-bold">{exam.title}</h3>
                    <p className="text-muted-foreground">
                      {exam.subject} • {exam.semester}
                    </p>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        {exam.date}
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="mr-1">🕒</span>
                        {exam.time}
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="mr-1">⏱️</span>
                        {exam.duration} minutes
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="mr-1">👥</span>
                        {exam.students} students
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 flex items-center justify-between p-6 bg-slate-50">
                    <div>
                      {exam.status === "completed" ? (
                        <Badge className="px-3 py-1 bg-green-500 text-white">Completed</Badge>
                      ) : (
                        <Badge className="px-3 py-1 bg-blue-500 text-white">Scheduled</Badge>
                      )}
                      
                      {exam.status === "completed" && (
                        <div className="mt-2">
                          <span className="font-semibold">Avg. Score:</span>{" "}
                          <span className="text-primary font-bold">{exam.averageScore}%</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/exam/monitor/${exam.id}`)}>
                        Monitor
                      </Button>
                      
                      <AlertDialog open={isDeleteDialogOpen && examToDelete === exam.id} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteExam(exam.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the exam "{exam.title}" and all associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive" onClick={confirmDeleteExam}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground mb-4">No exams found matching your filters</p>
              <Button onClick={() => setActiveTab("create")}>Create New Exam</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex mb-6 border-b overflow-x-auto">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "overview" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "create" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("create")}
        >
          Create Exam
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "manage" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("manage")}
        >
          Manage Exams
        </button>
      </div>
      
      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "create" && renderCreateTab()}
      {activeTab === "manage" && renderManageTab()}
    </div>
  );
}
