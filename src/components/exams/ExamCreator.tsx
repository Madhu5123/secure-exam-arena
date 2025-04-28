import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createExam } from "@/services/ExamService";
import { fetchAcademicData, fetchDepartmentSubjects } from "@/services/AcademicService";
import { db } from "@/config/firebase";
import { ref, onValue } from "firebase/database";

type QuestionType = "multiple-choice" | "true-false" | "short-answer";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  section?: string;
  timeLimit?: number;
}

export function ExamCreator() {
  const [activeTab, setActiveTab] = useState("details");
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examSemester, setExamSemester] = useState("");
  const [examDuration, setExamDuration] = useState("60");
  const [examStartDate, setExamStartDate] = useState("");
  const [examEndDate, setExamEndDate] = useState("");
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [availableSubjectsForSemester, setAvailableSubjectsForSemester] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [teacherDepartment, setTeacherDepartment] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: "1",
    type: "multiple-choice",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1,
    section: "Section 1",
    timeLimit: 5
  });
  const [examSections, setExamSections] = useState([{ id: "section-1", name: "Section 1", timeLimit: 30 }]);
  const [currentSection, setCurrentSection] = useState("Section 1");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<{id: string, name: string, photo?: string, semester?: string}[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('examUser');
    if (user) {
      const userData = JSON.parse(user);
      const teacherRef = ref(db, `users/${userData.id}`);
      onValue(teacherRef, (snapshot) => {
        if (snapshot.exists()) {
          const teacherData = snapshot.val();
          setTeacherDepartment(teacherData.department || '');
        }
      });
    }

    const studentsRef = ref(db, 'users');
    onValue(studentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const studentsList: any[] = [];
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'student') {
            studentsList.push({
              id: childSnapshot.key,
              name: userData.name || 'Unknown Student',
              photo: userData.photo || '',
              semester: userData.semester || ''
            });
          }
        });
        setAvailableStudents(studentsList);
      }
    });
  }, []);

  useEffect(() => {
    if (teacherDepartment) {
      console.log("Fetching academic data for department:", teacherDepartment);
      const loadAcademicData = async () => {
        const data = await fetchAcademicData(teacherDepartment);
        console.log("Academic data received:", data);
        setAvailableSemesters(data.semesters || []);
      };
      loadAcademicData();
    }
  }, [teacherDepartment]);

  useEffect(() => {
    if (teacherDepartment && examSemester) {
      console.log(`Fetching subjects for department ${teacherDepartment} and semester ${examSemester}`);
      const loadSubjects = async () => {
        const subjects = await fetchDepartmentSubjects(teacherDepartment, examSemester);
        console.log("Subjects received:", subjects);
        setAvailableSubjectsForSemester(subjects);
      };
      loadSubjects();
    } else {
      setAvailableSubjectsForSemester([]);
    }
  }, [teacherDepartment, examSemester]);

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
      description: `Question ${questions.length + 1} added successfully`,
    });
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    toast({
      title: "Question removed",
      description: "Question has been removed from the exam",
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    let newQuestion = { ...currentQuestion, type };
    
    if (type === "multiple-choice") {
      newQuestion.options = ["", "", "", ""];
      newQuestion.correctAnswer = "";
    } else if (type === "true-false") {
      newQuestion.options = ["True", "False"];
      newQuestion.correctAnswer = "";
    } else {
      delete newQuestion.options;
      newQuestion.correctAnswer = "";
    }
    
    setCurrentQuestion(newQuestion);
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(
      selectedStudents.includes(studentId)
        ? selectedStudents.filter(id => id !== studentId)
        : [...selectedStudents, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === availableStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudents.map(student => student.id));
    }
  };

  const handleAddSection = () => {
    const newSectionId = `section-${examSections.length + 1}`;
    const newSectionName = `Section ${examSections.length + 1}`;
    setExamSections([...examSections, { id: newSectionId, name: newSectionName, timeLimit: 30 }]);
    setCurrentSection(newSectionName);
  };

  const handleSectionTimeLimitChange = (index: number, timeLimit: number) => {
    const updatedSections = [...examSections];
    updatedSections[index].timeLimit = timeLimit;
    setExamSections(updatedSections);
  };

  const handleSaveExam = async () => {
    if (!examTitle || !examSubject || !examDuration || !examStartDate || !examEndDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required exam details",
        variant: "destructive"
      });
      setActiveTab("details");
      return;
    }

    if (!examSemester) {
      toast({
        title: "Missing semester",
        description: "Please select a semester for the exam",
        variant: "destructive"
      });
      setActiveTab("details");
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
    
    const formattedSections = examSections.map(section => ({
      id: section.id,
      name: section.name,
      timeLimit: section.timeLimit,
      questions: questions.filter(q => q.section === section.name)
    }));
    
    const examData = {
      title: examTitle,
      subject: examSubject,
      semester: examSemester,
      createdBy: userData.id,
      startDate: examStartDate,
      endDate: examEndDate,
      duration: Number(examDuration),
      status: "scheduled" as const,
      questions: questions,
      assignedStudents: selectedStudents,
      sections: formattedSections,
      department: teacherDepartment
    };

    const result = await createExam(examData);
    
    if (result.success) {
      toast({
        title: "Exam created",
        description: "The exam has been created and assigned successfully",
      });
      
      navigate("/dashboard");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create exam",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Exam</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  {availableSemesters.map(semester => (
                    <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="examSubject">Subject</Label>
              <Select value={examSubject} onValueChange={setExamSubject} disabled={!examSemester}>
                <SelectTrigger>
                  <SelectValue placeholder={examSemester ? "Select subject" : "Select semester first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjectsForSemester.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="examDuration">Duration (minutes)</Label>
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
              <Label htmlFor="examStartDate">Start Date & Time</Label>
              <Input
                id="examStartDate"
                type="datetime-local"
                value={examStartDate}
                onChange={(e) => setExamStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="examEndDate">End Date & Time</Label>
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
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={() => setActiveTab("questions")}>Next: Add Questions</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="questions" className="pt-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Current Questions ({questions.length})</h2>
            
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
                          <span>{question.points} {question.points === 1 ? "point" : "points"}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{question.text}</p>
                      
                      {question.type === "multiple-choice" && (
                        <div className="mt-2 space-y-1">
                          {question.options?.map((option, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                                question.correctAnswer === String(i) ? "bg-exam-primary text-white" : "border"
                              }`}>
                                {question.correctAnswer === String(i) && "✓"}
                              </div>
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === "true-false" && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                              question.correctAnswer === "0" ? "bg-exam-primary text-white" : "border"
                            }`}>
                              {question.correctAnswer === "0" && "✓"}
                            </div>
                            <span>True</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                              question.correctAnswer === "1" ? "bg-exam-primary text-white" : "border"
                            }`}>
                              {question.correctAnswer === "1" && "✓"}
                            </div>
                            <span>False</span>
                          </div>
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
              <CardTitle>Add New Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="questionType">Question Type</Label>
                <Select 
                  value={currentQuestion.type} 
                  onValueChange={(val) => handleQuestionTypeChange(val as QuestionType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="questionText">Question Text</Label>
                <Textarea
                  id="questionText"
                  placeholder="Enter your question here"
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                  rows={3}
                />
              </div>
              
              {currentQuestion.type === "multiple-choice" && (
                <div className="space-y-4">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <RadioGroup 
                          value={currentQuestion.correctAnswer} 
                          onValueChange={(val) => setCurrentQuestion({ ...currentQuestion, correctAnswer: val })}
                          className="flex-shrink-0"
                        >
                          <RadioGroupItem value={String(index)} id={`option-${index}`} />
                        </RadioGroup>
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-grow"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentQuestion.type === "true-false" && (
                <div className="space-y-4">
                  <Label>Correct Answer</Label>
                  <RadioGroup 
                    value={currentQuestion.correctAnswer} 
                    onValueChange={(val) => setCurrentQuestion({ ...currentQuestion, correctAnswer: val })}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="0" id="true" />
                      <Label htmlFor="true">True</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="false" />
                      <Label htmlFor="false">False</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              {currentQuestion.type === "short-answer" && (
                <div className="grid gap-2">
                  <Label htmlFor="correctAnswer">Correct Answer</Label>
                  <Input
                    id="correctAnswer"
                    placeholder="Enter the correct answer"
                    value={currentQuestion.correctAnswer || ""}
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
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: Number(e.target.value) || 1 })}
                  className="w-24"
                />
              </div>
              
              <Button onClick={handleAddQuestion} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex justify-between gap-2 pt-4">
            <Button variant="outline" onClick={() => setActiveTab("details")}>Back to Details</Button>
            <Button 
              onClick={() => setActiveTab("students")}
              disabled={questions.length === 0}
            >
              Next: Assign Students
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="students" className="pt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={handleSelectAllStudents}>
                  {selectedStudents.length === availableStudents.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <div className="space-y-3">
                {availableStudents
                  .filter(student => examSemester ? student.semester === examSemester : true)
                  .map((student) => (
                    <div key={student.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                      <Checkbox 
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleStudentSelection(student.id)}
                      />
                      <div className="flex items-center gap-2">
                        {student.photo && (
                          <img src={student.photo} alt={student.name} className="h-8 w-8 rounded-full object-cover" />
                        )}
                        <Label htmlFor={`student-${student.id}`} className="flex-grow cursor-pointer">
                          {student.name}
                        </Label>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between gap-2 pt-4">
            <Button variant="outline" onClick={() => setActiveTab("questions")}>Back to Questions</Button>
            <Button onClick={handleSaveExam}>
              <Save className="h-4 w-4 mr-2" />
              Save Exam
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
