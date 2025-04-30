import { useState, useEffect, ChangeEvent } from 'react';
import { getExamById, getExamSubmissions, getStudentWarnings } from '@/services/ExamService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Camera, Clock, Timer, FileText, PenLine } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ref, get, update } from 'firebase/database';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';

interface ExamMonitorProps {
  examId?: string;
}

interface Student {
  id: string;
  name: string;
  photo?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  startTime?: string;
  endTime?: string;
  answers?: Record<string, string>;
  warningCount?: number;
  timeTaken?: number;
  warnings?: Array<{
    type: string;
    timestamp: string;
    imageUrl: string;
  }>;
  status: 'completed' | 'in-progress' | 'not-started';
  evaluated?: boolean;
  pendingEvaluation?: boolean;
}

interface Question {
  id: string;
  text: string;
  type: string;
  points: number;
  correctAnswer?: string;
}

export function ExamMonitor({ examId }: ExamMonitorProps) {
  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [warningsDialogOpen, setWarningsDialogOpen] = useState(false);
  const [studentWarnings, setStudentWarnings] = useState<Array<{
    type: string;
    timestamp: string;
    imageUrl: string;
  }>>([]);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [shortAnswerQuestions, setShortAnswerQuestions] = useState<Question[]>([]);
  const [shortAnswerResponses, setShortAnswerResponses] = useState<{[key: string]: string}>({});
  const [scores, setScores] = useState<{[key: string]: number}>({});
  const [hasShortAnswers, setHasShortAnswers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) {
        setError('No exam ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch exam details
        const examResult = await getExamById(examId);
        
        if (!examResult.success || !examResult.exam) {
          setError('Failed to fetch exam');
          setLoading(false);
          return;
        }
        
        setExam(examResult.exam);
        
        // Check if exam has short answer questions
        const shortAnswers = examResult.exam.questions.filter((q: any) => q.type === 'short-answer');
        setHasShortAnswers(shortAnswers.length > 0);
        setShortAnswerQuestions(shortAnswers);
        
        // Fetch submissions
        const submissionsResult = await getExamSubmissions(examId);
        
        // Fetch student data
        const studentsRef = ref(db, 'users');
        const studentSnapshot = await get(studentsRef);
        
        const studentsData: Student[] = [];
        const studentProfiles: Record<string, { name: string, photo: string }> = {};
        
        // Get student profile information
        if (studentSnapshot.exists()) {
          studentSnapshot.forEach((childSnapshot) => {
            const studentData = childSnapshot.val();
            if (studentData && studentData.role === 'student') {
              studentProfiles[childSnapshot.key as string] = {
                name: studentData.name || "Unknown Student",
                photo: studentData.photo || ""
              };
            }
          });
        }
        
        // Get assigned students and submissions
        if (examResult.exam.assignedStudents) {
          for (const studentId of examResult.exam.assignedStudents) {
            const submission = submissionsResult.success ? 
              submissionsResult.submissions.find((sub: any) => sub.studentId === studentId) : 
              null;
            
            const studentProfile = studentProfiles[studentId] || { 
              name: `Student ${studentId.slice(-4)}`,
              photo: ""
            };
            
            if (submission) {
              // Student has a submission
              const startTime = new Date(submission.startTime);
              const endTime = new Date(submission.endTime);
              const timeTaken = submission.timeTaken || 
                Math.round((endTime.getTime() - startTime.getTime()) / 60000); // in minutes
              
              // Check if the submission needs evaluation (has short answers and not yet evaluated)
              const pendingEvaluation = hasShortAnswers && 
                submission.answers && 
                Object.keys(submission.answers).some(key => {
                  const question = examResult.exam.questions.find((q: any) => q.id === key);
                  return question && question.type === 'short-answer';
                }) && 
                !submission.evaluated;
              
              studentsData.push({
                id: studentId,
                name: studentProfile.name,
                photo: studentProfile.photo,
                score: submission.score || 0,
                maxScore: submission.maxScore || 0,
                percentage: submission.percentage || 0,
                startTime: startTime.toLocaleString(),
                endTime: endTime.toLocaleString(),
                answers: submission.answers,
                warningCount: submission.warningCount || 0,
                warnings: submission.warnings || [],
                status: 'completed',
                timeTaken: timeTaken,
                evaluated: submission.evaluated || false,
                pendingEvaluation: pendingEvaluation
              });
            } else {
              // Student hasn't taken the exam
              studentsData.push({
                id: studentId,
                name: studentProfile.name,
                photo: studentProfile.photo,
                status: 'not-started'
              });
            }
          }
        }
        
        setStudents(studentsData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching exam data:', err);
        setError('An error occurred while fetching exam data');
        setLoading(false);
      }
    };
    
    fetchExamData();
  }, [examId]);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleViewWarnings = (student: Student) => {
    setSelectedStudent(student);
    if (student.warnings && student.warnings.length > 0) {
      setStudentWarnings(student.warnings);
      setWarningsDialogOpen(true);
    } else {
      setStudentWarnings([]);
      setWarningsDialogOpen(true);
    }
  };

  const handleEvaluate = (student: Student) => {
    setSelectedStudent(student);
    
    if (!student.answers) {
      toast({
        title: "No answers available",
        description: "There are no answers to evaluate for this student.",
        variant: "destructive"
      });
      return;
    }
    
    // Find all short answer questions and their responses
    const questionsToEval: Question[] = [];
    const responses: {[key: string]: string} = {};
    const initialScores: {[key: string]: number} = {};
    
    if (exam && exam.questions) {
      exam.questions.forEach((question: any) => {
        if (question.type === 'short-answer' && student.answers && student.answers[question.id]) {
          questionsToEval.push(question);
          responses[question.id] = student.answers[question.id];
          // Fix the property access error by using score property if available or defaulting to 0
          initialScores[question.id] = student.evaluated ? (student.score ? student.score : 0) : 0;
        }
      });
    }
    
    setShortAnswerQuestions(questionsToEval);
    setShortAnswerResponses(responses);
    setScores(initialScores);
    setCurrentQuestion(0);
    setEvaluationDialogOpen(true);
  };

  const handleScoreChange = (questionId: string, score: number) => {
    setScores({
      ...scores,
      [questionId]: score
    });
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < shortAnswerQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedStudent || !exam) return;
    
    try {
      // Calculate total score
      let totalScore = 0;
      let totalMaxScore = 0;
      
      // Add scores from multiple choice questions (already evaluated)
      if (exam.questions) {
        exam.questions.forEach((question: any) => {
          totalMaxScore += question.points || 0;
          
          // For multiple choice questions, use the previously calculated score
          if (question.type === 'multiple-choice' && selectedStudent.answers && selectedStudent.answers[question.id]) {
            const answer = selectedStudent.answers[question.id];
            if (answer === question.correctAnswer) {
              totalScore += question.points || 0;
            }
          }
          
          // For short answer questions, use the teacher's evaluation
          if (question.type === 'short-answer' && scores[question.id] !== undefined) {
            totalScore += scores[question.id];
          }
        });
      }
      
      // Calculate percentage
      const percentage = Math.round((totalScore / totalMaxScore) * 100);
      
      // Update submission in database - fix the path to use proper collection
      const submissionRef = ref(db, `exams/${examId}/submissions/${selectedStudent.id}`);
      await update(submissionRef, {
        score: totalScore,
        maxScore: totalMaxScore,
        percentage,
        evaluated: true,
        scores: scores
      });
      
      // Update local state
      setStudents(students.map(student => {
        if (student.id === selectedStudent.id) {
          return {
            ...student,
            score: totalScore,
            maxScore: totalMaxScore,
            percentage,
            evaluated: true,
            pendingEvaluation: false
          };
        }
        return student;
      }));
      
      toast({
        title: "Evaluation submitted",
        description: `Successfully evaluated ${selectedStudent.name}'s answers.`,
      });
      
      setEvaluationDialogOpen(false);
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to submit evaluation. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-2 text-muted-foreground">Loading exam data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!exam) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Exam not found</CardTitle>
          <CardDescription>The exam you're looking for doesn't exist or has been deleted.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{exam.title}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div>
                    <span className="text-muted-foreground">Subject:</span> {exam.subject}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span> {exam.date}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span> {exam.time}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span> {exam.duration} minutes
                  </div>
                </div>
              </CardDescription>
            </div>
            <Badge className={
              exam.status === 'completed' ? 'bg-green-100 text-green-800' :
              exam.status === 'active' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {exam.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="results">
        <TabsList className="mb-4">
          <TabsTrigger value="results">Exam Results</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>
                {students.length} students assigned • {students.filter(s => s.status === 'completed').length} completed
                {hasShortAnswers && (
                  <span className="ml-2 text-amber-600 font-medium">
                    • {students.filter(s => s.pendingEvaluation).length} pending evaluation
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Student</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-center py-3 px-4">Score</th>
                      <th className="text-center py-3 px-4">Percentage</th>
                      <th className="text-center py-3 px-4">Time Taken</th>
                      <th className="text-center py-3 px-4">Warnings</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                {student.photo ? (
                                  <AvatarImage src={student.photo} alt={student.name} />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {student.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="font-medium">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              student.status === 'completed' ? 'bg-green-100 text-green-800' :
                              student.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {student.status === 'completed' ? 'Completed' :
                               student.status === 'in-progress' ? 'In Progress' :
                               'Not Started'}
                            </Badge>
                            {student.pendingEvaluation && (
                              <Badge className="ml-2 bg-amber-100 text-amber-800">
                                Needs Evaluation
                              </Badge>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? (
                              hasShortAnswers && !student.evaluated ? (
                                <span className="text-amber-600">Pending Evaluation</span>
                              ) : (
                                `${student.score}/${student.maxScore}`
                              )
                            ) : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' && student.evaluated ? 
                              <span className={`font-medium ${
                                (student.percentage || 0) >= 70 ? 'text-green-600' : 
                                (student.percentage || 0) >= 40 ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}>
                                {student.percentage}%
                              </span> : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              <span className="flex items-center justify-center">
                                <Timer className="h-4 w-4 mr-1 text-primary" />
                                {student.timeTaken} min
                              </span> : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              <span className={`font-medium ${
                                (student.warningCount || 0) > 0 ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {student.warningCount || 0}
                              </span> : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {student.status === 'completed' && (student.warningCount || 0) > 0 && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewWarnings(student)}
                                  className="flex items-center gap-1"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  View
                                </Button>
                              )}
                              {student.status === 'completed' && hasShortAnswers && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEvaluate(student)}
                                  className={`flex items-center gap-1 ${
                                    student.pendingEvaluation ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : ''
                                  }`}
                                >
                                  <PenLine className="h-4 w-4" />
                                  {student.evaluated ? "Review" : "Evaluate"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-muted-foreground">
                          No students found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Exam Statistics</CardTitle>
              <CardDescription>Overall performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Participation</h3>
                  <p className="text-3xl font-bold">
                    {Math.round((students.filter(s => s.status === 'completed').length / students.length) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {students.filter(s => s.status === 'completed').length} of {students.length} students
                  </p>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Average Score</h3>
                  <p className="text-3xl font-bold">
                    {students.filter(s => s.status === 'completed' && s.evaluated).length > 0
                      ? Math.round(students.filter(s => s.status === 'completed' && s.evaluated)
                          .reduce((sum, s) => sum + (s.percentage || 0), 0) / 
                          students.filter(s => s.status === 'completed' && s.evaluated).length)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {students.filter(s => s.percentage && s.percentage >= 40 && s.evaluated).length} passing students
                  </p>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Average Time</h3>
                  <p className="text-3xl font-bold">
                    {students.filter(s => s.status === 'completed').length > 0
                      ? Math.round(students.filter(s => s.status === 'completed')
                          .reduce((sum, s) => sum + (s.timeTaken || 0), 0) / 
                          students.filter(s => s.status === 'completed').length * 10) / 10
                      : 0} min
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Out of {exam.duration} min allowed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warnings Dialog */}
      <Dialog open={warningsDialogOpen} onOpenChange={setWarningsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Warnings for {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              {studentWarnings.length} warnings detected during the exam
            </DialogDescription>
          </DialogHeader>
          
          {studentWarnings.length > 0 ? (
            <div className="space-y-6 mt-4">
              {studentWarnings.map((warning, index) => (
                <Card key={index} className="border border-amber-200">
                  <CardHeader className="bg-amber-50 py-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <CardTitle className="text-base">{warning.type}</CardTitle>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(warning.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-col items-center">
                      <img 
                        src={warning.imageUrl} 
                        alt={`Warning: ${warning.type}`} 
                        className="rounded-md max-h-64 object-contain mb-2"
                      />
                      <div className="text-sm text-muted-foreground mt-2">
                        Warning {index + 1} of {studentWarnings.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-semibold">No warning images available</p>
              <p className="text-sm text-muted-foreground">
                This student has warnings recorded, but no images were captured.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              Evaluate Short Answers for {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Question {currentQuestion + 1} of {shortAnswerQuestions.length}
            </DialogDescription>
          </DialogHeader>
          
          {shortAnswerQuestions.length > 0 && currentQuestion < shortAnswerQuestions.length ? (
            <div className="space-y-6 mt-4">
              <Card className="border border-muted">
                <CardHeader className="bg-muted/20">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Question {currentQuestion + 1}</CardTitle>
                    <Badge>
                      {shortAnswerQuestions[currentQuestion].points} {
                        shortAnswerQuestions[currentQuestion].points === 1 ? 'point' : 'points'
                      }
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-lg font-medium">{shortAnswerQuestions[currentQuestion].text}</p>
                  
                  <div className="mt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Student's Answer:</p>
                    <div className="bg-muted/20 p-4 rounded-md min-h-[100px]">
                      {shortAnswerResponses[shortAnswerQuestions[currentQuestion].id] || 
                        <span className="text-muted-foreground italic">No answer provided</span>
                      }
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Expected Answer:</p>
                    <div className="bg-green-50 p-4 rounded-md border border-green-100">
                      {shortAnswerQuestions[currentQuestion].correctAnswer || 
                        <span className="text-muted-foreground italic">No model answer provided</span>
                      }
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Label htmlFor="score" className="flex justify-between">
                      <span>Score for this answer</span>
                      <span className="text-primary font-medium">
                        {scores[shortAnswerQuestions[currentQuestion].id] || 0} / {shortAnswerQuestions[currentQuestion].points}
                      </span>
                    </Label>
                    <Input
                      id="score"
                      type="range"
                      min="0"
                      max={shortAnswerQuestions[currentQuestion].points}
                      step="1"
                      value={scores[shortAnswerQuestions[currentQuestion].id] || 0}
                      onChange={(e) => handleScoreChange(
                        shortAnswerQuestions[currentQuestion].id,
                        parseInt(e.target.value)
                      )}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>{shortAnswerQuestions[currentQuestion].points}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                >
                  Previous Question
                </Button>
                
                {currentQuestion < shortAnswerQuestions.length - 1 ? (
                  <Button onClick={handleNextQuestion}>
                    Next Question
                  </Button>
                ) : (
                  <Button onClick={handleSubmitEvaluation}>
                    Submit Evaluation
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-semibold">No short answer questions</p>
              <p className="text-sm text-muted-foreground">
                This exam doesn't have any short answer questions to evaluate.
              </p>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEvaluationDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleSubmitEvaluation}>
              Submit Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
