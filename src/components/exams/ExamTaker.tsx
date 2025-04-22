
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Mock exam data
const mockExamData = {
  id: "exam-1",
  title: "Mid-term Mathematics",
  subject: "Mathematics",
  duration: 120, // minutes
  totalQuestions: 15,
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
      ]
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
      ]
    },
    {
      id: "q3",
      type: "true-false",
      text: "The sum of angles in a triangle is 180 degrees.",
      options: ["True", "False"]
    },
    {
      id: "q4",
      type: "short-answer",
      text: "What is the derivative of f(x) = x²?",
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
      ]
    },
    // More questions would be here in a real exam
  ]
};

export function ExamTaker() {
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState<string>("00:00:00");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraError, setIsCameraError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      // In a real app, this would fetch from Firebase
      setExam(mockExamData);
      
      // Initialize answers object
      const initialAnswers: Record<string, string> = {};
      mockExamData.questions.forEach(question => {
        initialAnswers[question.id] = "";
      });
      setAnswers(initialAnswers);

      // Set remaining time
      setRemainingSeconds(mockExamData.duration * 60);
      setLoading(false);
    };

    fetchExam();
  }, [id]);

  // Update remaining time
  useEffect(() => {
    if (!exam || isInstructionsOpen) return;

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
  }, [exam, isInstructionsOpen]);

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
      if (document.visibilityState === 'hidden' && !isInstructionsOpen) {
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
  }, [isInstructionsOpen, toast]);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraError(false);
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
    await initializeCamera();
    
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
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < exam.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSubmitExam = () => {
    // Check if all questions are answered
    const unansweredQuestions = Object.values(answers).filter(answer => answer === "").length;
    
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

  const handleConfirmSubmit = () => {
    // In a real app, this would submit answers to Firebase
    
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
    
    navigate("/dashboard");
  };
  
  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: "Your exam time has ended. Your answers will be automatically submitted.",
      variant: "destructive",
    });
    
    // In a real app, this would submit answers to Firebase
    
    setTimeout(() => {
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
      
      navigate("/dashboard");
    }, 3000);
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
                <li>This exam contains {exam.totalQuestions} questions and has a time limit of {exam.duration} minutes.</li>
                <li>You must complete the exam in one session - do not close the browser or refresh the page.</li>
                <li>The exam will be in fullscreen mode. Attempts to exit fullscreen will be recorded.</li>
                <li>Your webcam will be active during the exam for proctoring purposes.</li>
                <li>Do not switch tabs or open other applications during the exam.</li>
                <li>Ensure you have a stable internet connection and a charged device.</li>
                <li>Use the navigation buttons to move between questions.</li>
                <li>Use the question panel to quickly jump to specific questions.</li>
                <li>You can submit your exam before the time expires.</li>
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

  // Get current question
  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="fullscreen-exam flex flex-col h-screen">
      {/* Top bar with timer and information */}
      <div className="bg-card p-3 border-b flex justify-between items-center">
        <div>
          <h1 className="font-bold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">{currentQuestionIndex + 1} of {exam.questions.length} questions</p>
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
          
          <div className="flex items-center gap-1 text-lg font-semibold">
            <Clock className="h-5 w-5 text-exam-primary" />
            <span>{remainingTime}</span>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-auto">
        {/* Question list sidebar */}
        <div className="order-2 lg:order-1 lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {exam.questions.map((q: any, index: number) => (
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
                <div className="text-sm mb-1">Progress</div>
                <Progress value={Object.values(answers).filter(a => a !== "").length / exam.questions.length * 100} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {Object.values(answers).filter(a => a !== "").length} of {exam.questions.length} answered
                </div>
              </div>
              
              <div className="camera-container mt-4">
                {isCameraError ? (
                  <div className="flex items-center justify-center h-full bg-muted">
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
                    className="w-full h-full object-cover"
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
                {currentQuestionIndex === exam.questions.length - 1 ? (
                  <Button onClick={handleSubmitExam}>
                    Submit Exam
                  </Button>
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
                {Object.values(answers).filter(a => a !== "").length} of {exam.questions.length} questions answered
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
