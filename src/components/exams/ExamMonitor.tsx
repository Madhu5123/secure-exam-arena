
import { useState, useEffect, ChangeEvent } from 'react';
import { getExamById, getExamSubmissions, getStudentWarnings, gradeShortAnswerSubmission } from '@/services/ExamService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Camera, Clock, Timer, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ref, get } from 'firebase/database';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';

interface ExamMonitorProps {
  examId: string;
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
  requiresGrading?: boolean;
}

interface Question {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  text: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export function ExamMonitor({ examId }: ExamMonitorProps) {
  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [warningsDialogOpen, setWarningsDialogOpen] = useState(false);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [studentWarnings, setStudentWarnings] = useState<Array<{
    type: string;
    timestamp: string;
    imageUrl: string;
  }>>([]);
  const [shortAnswerScores, setShortAnswerScores] = useState<Record<string, number>>({});
  const [shortAnswerQuestions, setShortAnswerQuestions] = useState<Question[]>([]);
  
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
        
        // Extract short answer questions
        const shortAnswers = examResult.exam.questions.filter(
          (q: Question) => q.type === "short-answer"
        );
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
              // Check if this submission has short answers that need grading
              const requiresGrading = examResult.exam.requiresManualGrading && 
                !submission.manuallyGraded && 
                examResult.exam.questions.some((q: Question) => 
                  q.type === "short-answer" && submission.answers && submission.answers[q.id]
                );
              
              // Student has a submission
              const startTime = new Date(submission.startTime);
              const endTime = new Date(submission.endTime);
              const timeTaken = submission.timeTaken || 
                Math.round((endTime.getTime() - startTime.getTime()) / 60000); // in minutes
              
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
                requiresGrading
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
  
  const handleGradeSubmission = (student: Student) => {
    setSelectedStudent(student);
    
    // Initialize scores for this student's short answers
    const initialScores: Record<string, number> = {};
    shortAnswerQuestions.forEach(question => {
      if (student.answers && student.answers[question.id]) {
        initialScores[question.id] = 0;
      }
    });
    
    setShortAnswerScores(initialScores);
    setGradingDialogOpen(true);
  };
  
  const handleScoreChange = (questionId: string, score: number) => {
    setShortAnswerScores(prev => ({
      ...prev,
      [questionId]: score
    }));
  };
  
  const handleSubmitGrades = async () => {
    if (!selectedStudent) return;
    
    try {
      const result = await gradeShortAnswerSubmission(
        examId,
        selectedStudent.id,
        shortAnswerScores
      );
      
      if (result.success) {
        toast({
          title: "Grades submitted",
          description: "The manual grades have been saved successfully"
        });
        
        // Update the local state
        setStudents(students.map(student => 
          student.id === selectedStudent.id 
            ? { 
                ...student, 
                requiresGrading: false,
                score: result.submission.score,
                percentage: result.submission.percentage
              } 
            : student
        ));
        
        setGradingDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit grades",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error submitting grades:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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

  // Count students requiring grading
  const needsGradingCount = students.filter(s => s.requiresGrading).length;

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
                  {exam.minPassingScore && (
                    <div>
                      <span className="text-muted-foreground">Passing Score:</span> {exam.minPassingScore}%
                    </div>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={
                exam.status === 'completed' ? 'bg-green-100 text-green-800' :
                exam.status === 'active' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }>
                {exam.status}
              </Badge>
              {exam.requiresManualGrading && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Requires Manual Grading
                </Badge>
              )}
            </div>
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
          {needsGradingCount > 0 && (
            <TabsTrigger value="grading" className="relative">
              Manual Grading
              <Badge className="ml-2 bg-amber-100 text-amber-800">{needsGradingCount}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>
                {students.length} students assigned • {students.filter(s => s.status === 'completed').length} completed
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
                              {student.requiresGrading && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  Needs Grading
                                </Badge>
                              )}
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
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              `${student.score}/${student.maxScore}` : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              <span className={`font-medium ${
                                (student.percentage || 0) >= (exam.minPassingScore || 70) ? 'text-green-600' : 
                                (student.percentage || 0) >= ((exam.minPassingScore || 70) * 0.85) ? 'text-yellow-600' : 
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
                              {student.requiresGrading && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGradeSubmission(student)}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-4 w-4" />
                                  Grade
                                </Button>
                              )}
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
                    {students.length > 0 ? Math.round((students.filter(s => s.status === 'completed').length / students.length) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {students.filter(s => s.status === 'completed').length} of {students.length} students
                  </p>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Average Score</h3>
                  <p className="text-3xl font-bold">
                    {students.filter(s => s.status === 'completed').length > 0
                      ? Math.round(students.filter(s => s.status === 'completed')
                          .reduce((sum, s) => sum + (s.percentage || 0), 0) / 
                          students.filter(s => s.status === 'completed').length)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {students.filter(s => s.percentage && s.percentage >= (exam.minPassingScore || 40)).length} passing students
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

        {needsGradingCount > 0 && (
          <TabsContent value="grading">
            <Card>
              <CardHeader>
                <CardTitle>Manual Grading Required</CardTitle>
                <CardDescription>
                  {needsGradingCount} student submissions need grading for short answer questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students
                    .filter(student => student.requiresGrading)
                    .map(student => (
                      <Card key={student.id} className="border-amber-200">
                        <CardHeader className="bg-amber-50 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                {student.photo ? (
                                  <AvatarImage src={student.photo} alt={student.name} />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {student.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <CardTitle className="text-base">{student.name}</CardTitle>
                            </div>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleGradeSubmission(student)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4 mr-1" /> Grade Now
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Submitted:</span> {student.endTime}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Current Score:</span> {student.score}/{student.maxScore} (short answers not graded)
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
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
      
      {/* Grading Dialog */}
      <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Grade Short Answer Questions for {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Review and assign scores to each short answer question
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {shortAnswerQuestions.map((question, index) => {
              const studentAnswer = selectedStudent?.answers?.[question.id];
              if (!studentAnswer) return null;
              
              return (
                <Card key={question.id} className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Question {index + 1}</CardTitle>
                    <CardDescription>
                      {question.points} {question.points === 1 ? "point" : "points"} possible
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="font-medium">Question:</Label>
                      <p className="mt-1">{question.text}</p>
                    </div>
                    
                    <div>
                      <Label className="font-medium">Model Answer:</Label>
                      <p className="mt-1">{question.correctAnswer}</p>
                    </div>
                    
                    <div>
                      <Label className="font-medium">Student's Answer:</Label>
                      <p className="mt-1 p-2 border rounded-md bg-muted/30">{studentAnswer}</p>
                    </div>
                    
                    <div>
                      <Label htmlFor={`score-${question.id}`} className="font-medium">
                        Score (0-{question.points})
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id={`score-${question.id}`}
                          type="number"
                          min="0"
                          max={question.points}
                          value={shortAnswerScores[question.id] || 0}
                          onChange={(e) => handleScoreChange(question.id, Math.min(question.points, Number(e.target.value)))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">out of {question.points}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitGrades}>Submit Grades</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
