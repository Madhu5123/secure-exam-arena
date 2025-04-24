
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getExamById, submitExam } from "@/services/ExamService";

interface ExamTakerProps {
  examId?: string;
}

// Mock exam data structure with sections
const mockExamData = {
  id: "exam-1",
  title: "Mid-term Mathematics",
  subject: "Mathematics",
  duration: 120, // minutes
  totalQuestions: 15,
  sections: [
    {
      id: "section-1",
      name: "Basic Concepts",
      timeLimit: 30, // minutes
      questions: [
        {
          id: "q1",
          type: "multiple-choice",
          text: "What is the value of x in the equation 2x + 5 = 15?",
          options: [
            "x = 3",
            "x = 5",
            "x = 7",
            "x = 10"
          ],
          points: 5
        },
        {
          id: "q2",
          type: "multiple-choice",
          text: "Which of the following is a prime number?",
          options: [
            "15",
            "21",
            "23",
            "27"
          ],
          points: 5
        },
        {
          id: "q3",
          type: "true-false",
          text: "The sum of angles in a triangle is 180 degrees.",
          options: ["True", "False"],
          points: 5
        }
      ]
    },
    {
      id: "section-2",
      name: "Advanced Concepts",
      timeLimit: 90, // minutes
      questions: [
        {
          id: "q4",
          type: "short-answer",
          text: "What is the derivative of f(x) = x²?",
          points: 10
        },
        {
          id: "q5",
          type: "multiple-choice",
          text: "Solve for y: 3y - 7 = 14",
          options: [
            "y = 5",
            "y = 7",
            "y = 9",
            "y = 21"
          ],
          points: 10
        }
      ]
    }
  ],
  instructions: [
    "Complete all sections within the allocated time.",
    "You must complete each section before moving to the next.",
    "Do not refresh or close the browser during the exam.",
    "Webcam monitoring is enabled throughout the exam.",
    "Switching tabs or applications is not allowed.",
    "If you experience technical issues, contact support immediately.",
    "Read all questions carefully before answering."
  ]
};

export function ExamTaker({ examId }: ExamTakerProps) {
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState<string>("00:00:00");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [sectionRemainingSeconds, setSectionRemainingSeconds] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [isSectionIntroOpen, setIsSectionIntroOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraError, setIsCameraError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [faceCount, setFaceCount] = useState(1); // Default to 1 face
  const [loading, setLoading] = useState(true);
  const [examComplete, setExamComplete] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      if (examId) {
        try {
          const result = await getExamById(examId);
          if (result.success) {
            setExam(result.exam);
            
            // Initialize answers object
            const initialAnswers: Record<string, string> = {};
            // Flatten questions from all sections
            const allQuestions = result.exam.sections 
              ? result.exam.sections.flatMap((section: any) => section.questions)
              : result.exam.questions;
              
            allQuestions.forEach((question: any) => {
              initialAnswers[question.id] = "";
            });
            setAnswers(initialAnswers);

            // Set remaining time
            setRemainingSeconds(result.exam.duration * 60);
            
            // Set section time if sections exist
            if (result.exam.sections && result.exam.sections.length > 0) {
              setSectionRemainingSeconds(result.exam.sections[0].timeLimit * 60);
            }
            
          } else {
            // Fallback to mock data
            setExam(mockExamData);
            
            // Initialize answers for mock data
            const initialAnswers: Record<string, string> = {};
            // Flatten questions from all sections
            mockExamData.sections.forEach(section => {
              section.questions.forEach(question => {
                initialAnswers[question.id] = "";
              });
            });
            setAnswers(initialAnswers);

            // Set remaining time
            setRemainingSeconds(mockExamData.duration * 60);
            
            // Set section time
            setSectionRemainingSeconds(mockExamData.sections[0].timeLimit * 60);
          }
        } catch (error) {
          console.error("Error fetching exam:", error);
          
          // Fallback to mock data
          setExam(mockExamData);
          
          // Initialize answers for mock data
          const initialAnswers: Record<string, string> = {};
          // Flatten questions from all sections
          mockExamData.sections.forEach(section => {
            section.questions.forEach(question => {
              initialAnswers[question.id] = "";
            });
          });
          setAnswers(initialAnswers);

          // Set remaining time
          setRemainingSeconds(mockExamData.duration * 60);
          
          // Set section time
          setSectionRemainingSeconds(mockExamData.sections[0].timeLimit * 60);
        }
      } else {
        // Fallback to mock data if no examId
        setExam(mockExamData);
        
        // Initialize answers for mock data
        const initialAnswers: Record<string, string> = {};
        // Flatten questions from all sections
        mockExamData.sections.forEach(section => {
          section.questions.forEach(question => {
            initialAnswers[question.id] = "";
          });
        });
        setAnswers(initialAnswers);

        // Set remaining time
        setRemainingSeconds(mockExamData.duration * 60);
        
        // Set section time
        setSectionRemainingSeconds(mockExamData.sections[0].timeLimit * 60);
      }
      
      setLoading(false);
    };

    fetchExam();
  }, [examId]);

  // Update remaining exam time
  useEffect(() => {
    if (!exam || isInstructionsOpen || isSectionIntroOpen) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [exam, isInstructionsOpen, isSectionIntroOpen]);

  // Update remaining section time
  useEffect(() => {
    if (!exam || isInstructionsOpen || isSectionIntroOpen || !exam.sections) return;

    const interval = setInterval(() => {
      setSectionRemainingSeconds(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          handleSectionTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [exam, currentSectionIndex, isInstructionsOpen, isSectionIntroOpen]);

  // Format remaining time
  useEffect(() => {
    if (remainingSeconds <= 0) {
      setRemainingTime("00:00:00");
      return;
    }

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    setRemainingTime(
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    );

    // Show time warning when 5 minutes remain
    if (remainingSeconds === 300) {
      toast({
        title: "Time warning",
        description: "You have 5 minutes remaining.",
        variant: "destructive",
      });
    }
  }, [remainingSeconds, toast]);

  // Format section remaining time
  const formatSectionTime = () => {
    if (sectionRemainingSeconds <= 0) {
      return "00:00:00";
    }

    const hours = Math.floor(sectionRemainingSeconds / 3600);
    const minutes = Math.floor((sectionRemainingSeconds % 3600) / 60);
    const seconds = sectionRemainingSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Monitor when user attempts to leave fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === null && isFullscreen) {
        // User has attempted to exit fullscreen
        setShowWarning(true);
        setWarningCount(prev => prev + 1);
        
        // Attempt to go back to fullscreen
        document.documentElement.requestFullscreen().catch(err => {
          console.error("Error attempting to re-enable fullscreen:", err);
        });
        
        toast({
          title: "Warning",
          description: "Exiting fullscreen during the exam is not allowed!",
          variant: "destructive",
        });
      }
      
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFullscreen, toast]);

  // Handle visibilitychange event (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isInstructionsOpen && !isSectionIntroOpen) {
        setWarningCount(prev => prev + 1);
        toast({
          title: "Warning",
          description: "Tab switching is not allowed during the exam!",
          variant: "destructive",
        });
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isInstructionsOpen, isSectionIntroOpen, toast]);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraError(false);
      
      // Mock face detection
      // In a real app, this would use a face detection API
      const faceDetectionInterval = setInterval(() => {
        const randomFaces = Math.random() > 0.9 ? 2 : Math.random() > 0.05 ? 1 : 0;
        setFaceCount(randomFaces);
        
        if (randomFaces === 0) {
          setWarningCount(prev => prev + 1);
          setShowWarning(true);
          toast({
            title: "Warning",
            description: "No face detected! Please ensure your face is visible.",
            variant: "destructive",
          });
        } else if (randomFaces > 1) {
          setWarningCount(prev => prev + 1);
          setShowWarning(true);
          toast({
            title: "Warning",
            description: "Multiple faces detected! Only you should be visible.",
            variant: "destructive",
          });
        }
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(faceDetectionInterval);
      
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCameraError(true);
      toast({
        title: "Camera access required",
        description: "Please allow camera access to continue with the exam",
        variant: "destructive",
      });
    }
  };

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleStartExam = async () => {
    const cleanupFn = await initializeCamera();
    
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
      toast({
        title: "Fullscreen required",
        description: "Please enable fullscreen to continue with the exam",
        variant: "destructive",
      });
      return;
    }
    
    setIsInstructionsOpen(false);
    
    // Show section introduction
    if (exam?.sections && exam.sections.length > 0) {
      setIsSectionIntroOpen(true);
    }
    
    return cleanupFn;
  };

  const handleStartSection = () => {
    setIsSectionIntroOpen(false);
    // Reset question index when starting a new section
    setCurrentQuestionIndex(0);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    const currentSection = exam.sections ? exam.sections[currentSectionIndex] : { questions: exam.questions };
    const questions = currentSection.questions;
    
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    const currentSection = exam.sections ? exam.sections[currentSectionIndex] : { questions: exam.questions };
    const questions = currentSection.questions;
    
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleMoveToNextSection = () => {
    if (exam.sections && currentSectionIndex < exam.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
      setSectionRemainingSeconds(exam.sections[currentSectionIndex + 1].timeLimit * 60);
      setIsSectionIntroOpen(true);
    } else {
      // If this is the last section, show submit dialog
      setIsSubmitDialogOpen(true);
    }
  };

  const handleSectionTimeUp = () => {
    toast({
      title: "Section time's up!",
      description: "Moving to the next section.",
      variant: "destructive",
    });
    
    handleMoveToNextSection();
  };

  const handleSubmitExam = () => {
    // Check if all questions are answered
    let unansweredQuestions = 0;
    
    if (exam.sections) {
      // For sectioned exams, check all questions across all sections
      exam.sections.forEach((section: any) => {
        section.questions.forEach((question: any) => {
          if (!answers[question.id]) unansweredQuestions++;
        });
      });
    } else {
      // For non-sectioned exams
      unansweredQuestions = Object.values(answers).filter(answer => answer === "").length;
    }
    
    if (unansweredQuestions > 0) {
      toast({
        title: "Unanswered questions",
        description: `You have ${unansweredQuestions} unanswered questions. Are you sure you want to submit?`,
        action: (
          <Button variant="destructive" onClick={() => {
            setIsSubmitDialogOpen(true);
          }}>
            Submit Anyway
          </Button>
        ),
      });
    } else {
      setIsSubmitDialogOpen(true);
    }
  };

  const handleConfirmSubmit = async () => {
    // In a real app, this would submit answers to Firebase
    try {
      if (examId) {
        const user = localStorage.getItem('examUser');
        if (user) {
          const userData = JSON.parse(user);
          const result = await submitExam(examId, userData.id, answers, warningCount);
          
          if (result.success) {
            setExamResult(result.submission);
          }
        }
      }
      
      setExamComplete(true);
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error("Error exiting fullscreen:", err);
        });
      }
      
      // Stop camera
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      toast({
        title: "Exam submitted",
        description: "Your exam has been submitted successfully",
      });
      
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your exam. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: "Your exam time has ended. Your answers will be automatically submitted.",
      variant: "destructive",
    });
    
    handleConfirmSubmit();
  };

  const handleFinishReview = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-2 text-muted-foreground">Loading exam...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Exam not found or access denied.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Display exam results if completed
  if (examComplete) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{exam.title} - Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 text-exam-success mx-auto mb-2" />
              <h3 className="text-xl font-semibold">Exam Completed</h3>
              <p className="text-muted-foreground">Your answers have been submitted successfully</p>
            </div>
            
            {examResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Score</div>
                    <div className="text-3xl font-bold">{examResult.score}/{examResult.maxScore}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Warnings</div>
                    <div className="text-3xl font-bold text-exam-warning">{examResult.warningCount}</div>
                  </Card>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Performance</div>
                  <Progress value={(examResult.score / examResult.maxScore) * 100} className="h-2" />
                  <div className="text-xs text-right mt-1">
                    {Math.round((examResult.score / examResult.maxScore) * 100)}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Results will be available soon.
              </div>
            )}
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Feedback</AlertTitle>
              <AlertDescription>
                Your exam has been submitted. You can view your detailed results later from your dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleFinishReview}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render instructions dialog
  if (isInstructionsOpen) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Exam Instructions</h3>
              <ul className="list-disc pl-6 space-y-2">
                {exam.instructions ? (
                  exam.instructions.map((instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  ))
                ) : (
                  <>
                    <li>This exam contains {exam.sections 
                      ? exam.sections.reduce((total: number, section: any) => total + section.questions.length, 0) 
                      : exam.totalQuestions} questions and has a time limit of {exam.duration} minutes.</li>
                    <li>You must complete the exam in one session - do not close the browser or refresh the page.</li>
                    <li>The exam will be in fullscreen mode. Attempts to exit fullscreen will be recorded.</li>
                    <li>Your webcam will be active during the exam for proctoring purposes.</li>
                    <li>Do not switch tabs or open other applications during the exam.</li>
                    <li>Ensure you have a stable internet connection and a charged device.</li>
                    <li>Use the navigation buttons to move between questions.</li>
                    <li>Use the question panel to quickly jump to specific questions.</li>
                    <li>You can submit your exam before the time expires.</li>
                  </>
                )}
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                By starting this exam, you consent to webcam monitoring and agree to follow the exam rules. Violations may result in disqualification.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <p>Are you ready to begin the exam?</p>
              <div className="flex justify-center space-x-2">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
                <Button onClick={handleStartExam}>
                  Start Exam
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render section introduction
  if (isSectionIntroOpen) {
    const currentSection = exam.sections[currentSectionIndex];
    
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Section {currentSectionIndex + 1}: {currentSection.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p><strong>Time Limit:</strong> {currentSection.timeLimit} minutes</p>
              <p><strong>Questions:</strong> {currentSection.questions.length}</p>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Section Information</AlertTitle>
                <AlertDescription>
                  You must complete this section within the allocated time. Once you move to the next section, you cannot return to this section.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="text-center space-y-2">
              <p>Are you ready to begin this section?</p>
              <div className="flex justify-center space-x-2">
                <Button onClick={handleStartSection}>
                  Start Section
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current section and question
  const currentSection = exam.sections ? exam.sections[currentSectionIndex] : { questions: exam.questions };
  const currentQuestion = currentSection.questions[currentQuestionIndex];

  // Calculate progress
  const calculateSectionProgress = () => {
    if (!currentSection) return 0;
    const answered = currentSection.questions.filter((q: any) => answers[q.id] && answers[q.id] !== "").length;
    return (answered / currentSection.questions.length) * 100;
  };

  return (
    <div className="fullscreen-exam flex flex-col h-screen">
      {/* Top bar with timer and information */}
      <div className="bg-card p-3 border-b flex justify-between items-center">
        <div>
          <h1 className="font-bold">{exam.title}</h1>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>
              Section {currentSectionIndex + 1}/{exam.sections ? exam.sections.length : 1}:
              {" "}{currentSection.name || "Questions"}
            </span>
            <span className="mx-2">•</span>
            <span>
              Question {currentQuestionIndex + 1}/{currentSection.questions.length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showWarning && (
            <Alert className="p-2 max-w-xs">
              <AlertTriangle className="h-4 w-4 text-exam-warning" />
              <AlertTitle className="text-exam-warning">Warning</AlertTitle>
              <AlertDescription className="text-sm">
                Irregular behavior detected. Warnings: {warningCount}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-lg font-semibold">
              <Clock className="h-5 w-5 text-exam-primary" />
              <span>{remainingTime}</span>
            </div>
            {exam.sections && (
              <div className="text-xs text-muted-foreground">
                Section: {formatSectionTime()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-auto">
        {/* Question list sidebar */}
        <div className="order-2 lg:order-1 lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-center">
                <span>Questions</span>
                {exam.sections && (
                  <Badge variant="outline">
                    Section {currentSectionIndex + 1}: {currentSection.name || "Questions"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {currentSection.questions.map((q: any, index: number) => (
                  <Button
                    key={q.id}
                    variant="outline"
                    size="sm"
                    className={`w-10 h-10 p-0 ${
                      index === currentQuestionIndex ? "bg-exam-primary text-white" : 
                      answers[q.id] ? "bg-muted" : ""
                    }`}
                    onClick={() => handleJumpToQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-exam-primary"></div>
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-muted"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full border"></div>
                  <span>Unanswered</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm mb-1">Section Progress</div>
                <Progress value={calculateSectionProgress()} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {currentSection.questions.filter((q: any) => answers[q.id] && answers[q.id] !== "").length} 
                  {" "}of{" "}
                  {currentSection.questions.length} answered
                </div>
              </div>
              
              <div className="camera-container mt-4">
                <div className="mb-2 text-sm font-semibold flex items-center justify-between">
                  <span>Camera Feed</span>
                  <div className={`h-2 w-2 rounded-full ${faceCount === 1 ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div>
                </div>
                {isCameraError ? (
                  <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                    <Alert className="p-2">
                      <AlertTriangle className="h-4 w-4 text-exam-warning" />
                      <AlertTitle className="text-exam-warning">Camera Error</AlertTitle>
                      <AlertDescription>
                        Please enable camera access
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Question content */}
        <div className="order-1 lg:order-2 lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg font-medium">{currentQuestion.text}</div>
              
              {currentQuestion.type === "multiple-choice" && (
                <RadioGroup 
                  value={answers[currentQuestion.id]}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                      <RadioGroupItem value={String(index)} id={`option-${currentQuestion.id}-${index}`} />
                      <Label htmlFor={`option-${currentQuestion.id}-${index}`} className="flex-grow cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {currentQuestion.type === "true-false" && (
                <RadioGroup 
                  value={answers[currentQuestion.id]}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 border p-3 rounded-md">
                    <RadioGroupItem value="0" id={`true-${currentQuestion.id}`} />
                    <Label htmlFor={`true-${currentQuestion.id}`} className="flex-grow cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-md">
                    <RadioGroupItem value="1" id={`false-${currentQuestion.id}`} />
                    <Label htmlFor={`false-${currentQuestion.id}`} className="flex-grow cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}
              
              {currentQuestion.type === "short-answer" && (
                <div className="space-y-2">
                  <Label htmlFor={`answer-${currentQuestion.id}`}>Your Answer</Label>
                  <Input
                    id={`answer-${currentQuestion.id}`}
                    value={answers[currentQuestion.id]}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => handleNavigation('prev')}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
              </div>
              <div>
                {currentQuestionIndex === currentSection.questions.length - 1 ? (
                  exam.sections && currentSectionIndex < exam.sections.length - 1 ? (
                    <Button onClick={handleMoveToNextSection}>
                      Next Section
                    </Button>
                  ) : (
                    <Button onClick={handleSubmitExam}>
                      Submit Exam
                    </Button>
                  )
                ) : (
                  <Button onClick={() => handleNavigation('next')}>
                    Next
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Submit dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your exam? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-center gap-2 text-exam-primary">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-medium">
                {Object.values(answers).filter(a => a !== "").length} of {
                  exam.sections 
                    ? exam.sections.reduce((total: number, section: any) => total + section.questions.length, 0)
                    : exam.questions ? exam.questions.length : exam.totalQuestions
                } questions answered
              </span>
            </div>
            
            {Object.values(answers).some(a => a === "") && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You have {Object.values(answers).filter(a => a === "").length} unanswered questions. Unanswered questions will be marked as incorrect.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit}>
              Submit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
