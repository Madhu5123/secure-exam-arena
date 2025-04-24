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
import { fetchAcademicData } from "@/services/AcademicService";

type QuestionType = "multiple-choice" | "true-false" | "short-answer";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export function ManageExams() {
  const [examTitle, setExamTitle] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDuration, setExamDuration] = useState("60");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [subjectsBySemester, setSubjectsBySemester] = useState<Record<string, string[]>>({});
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        // Assuming we have the department ID from context or props
        const departmentId = "your-department-id"; // You'll need to get this from your app's context
        const academicData = await fetchAcademicData(departmentId);
        setSemesters(academicData.semesters);
        setSubjectsBySemester(academicData.subjectsBySemester);
      } catch (error) {
        console.error("Error loading academic data:", error);
        toast({
          title: "Error",
          description: "Failed to load academic data",
          variant: "destructive",
        });
      }
    };

    loadAcademicData();
  }, [toast]);

  useEffect(() => {
    if (selectedSemester) {
      setAvailableSubjects(subjectsBySemester[selectedSemester] || []);
      setExamSubject(""); // Reset subject when semester changes
    } else {
      setAvailableSubjects([]);
    }
  }, [selectedSemester, subjectsBySemester]);

  const [activeTab, setActiveTab] = useState("details");
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: "1",
    type: "multiple-choice",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1
  });
  const navigate = useNavigate();

  // Mock student data
  const availableStudents = [
    { id: "1", name: "Alex Johnson" },
    { id: "2", name: "Emily Chen" },
    { id: "3", name: "Michael Brown" },
    { id: "4", name: "Sarah Williams" },
    { id: "5", name: "James Davis" },
  ];

  const handleAddQuestion = () => {
    // Validate question
    if (!currentQuestion.text) {
      toast({
        title: "Incomplete question",
        description: "Please add question text",
        variant: "destructive"
      });
      return;
    }

    // Validate based on question type
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

    // Add question to list
    setQuestions([...questions, { ...currentQuestion }]);
    
    // Reset current question
    const newId = String(questions.length + 2);
    setCurrentQuestion({
      id: newId,
      type: "multiple-choice",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1
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

  const handleSaveExam = async () => {
    // Validate required fields
    if (!examTitle || !examSubject || !selectedSemester || !examDuration || !startDate || !startTime || !endDate || !endTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required exam details",
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
      return;
    }

    if (selectedStudents.length === 0) {
      toast({
        title: "No students assigned",
        description: "Please assign this exam to at least one student",
        variant: "destructive"
      });
      return;
    }

    try {
      const formattedSections = [];

      const examData = {
        title: examTitle,
        subject: examSubject,
        semester: selectedSemester,
        createdBy: "current-user-id", // You'll need to get this from your auth context
        startDate: `${startDate}T${startTime}`,
        endDate: `${endDate}T${endTime}`,
        duration: Number(examDuration),
        status: "scheduled" as const,
        questions: questions,
        assignedStudents: selectedStudents,
        sections: formattedSections,
        department: "current-department-id" // You'll need to get this from your context
      };

      const result = await createExam(examData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Exam created successfully",
        });
        // Reset form or redirect
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create exam",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create exam",
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
              <Label htmlFor="semester">Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={examSubject} onValueChange={setExamSubject} disabled={!selectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedSemester ? "Select subject" : "Select semester first"} />
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Start Date & Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>End Date & Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
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
                {availableStudents.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                    <Checkbox 
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleStudentSelection(student.id)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="flex-grow cursor-pointer">
                      {student.name}
                    </Label>
                  </div>
                ))}
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
