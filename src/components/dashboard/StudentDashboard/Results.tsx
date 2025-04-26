
import { useState, useEffect } from "react";
import { Eye, Check, X, Clock, AlertTriangle } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getStudentResults } from "@/services/ExamService";
import { format } from "date-fns";

interface ResultsProps {
  studentId: string;
}

export function Results({ studentId }: ResultsProps) {
  const [results, setResults] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      const response = await getStudentResults(studentId);
      if (response.success) {
        setResults(response.results);
      }
    };

    fetchResults();
  }, [studentId]);

  const formatDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "N/A";
    
    const minutes = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
    
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam</TableHead>
              <TableHead className="hidden md:table-cell">Subject</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="hidden md:table-cell text-right">Time Taken</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length > 0 ? (
              results.map((result) => (
                <TableRow key={result.examId} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div>
                      <p>{result.examTitle}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{result.examSubject}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{result.examSubject}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={result.percentage >= 40 ? "default" : "destructive"} className="font-medium">
                      {result.percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right text-sm">
                    {formatDuration(result.startTime, result.endTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={() => {
                        setSelectedExam(result);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No exam results available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedExam?.examTitle}</DialogTitle>
            <DialogDescription>
              Review your submission for {selectedExam?.examSubject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className={`text-2xl font-bold ${selectedExam?.percentage >= 40 ? 'text-primary' : 'text-destructive'}`}>
                    {selectedExam?.percentage}%
                  </div>
                  <div className="ml-auto">
                    {selectedExam?.percentage >= 40 ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedExam?.score}/{selectedExam?.maxScore} points
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Time Taken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-2xl font-bold">
                    {selectedExam?.endTime && selectedExam?.startTime 
                      ? Math.round((new Date(selectedExam.endTime).getTime() - new Date(selectedExam.startTime).getTime()) / 60000)
                      : 0} mins
                  </div>
                  <Clock className="h-5 w-5 ml-auto text-muted-foreground" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedExam?.startTime && format(new Date(selectedExam.startTime), "MMM d, yyyy")}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-2xl font-bold">
                    {selectedExam?.warningCount || 0}
                  </div>
                  <AlertTriangle className={`h-5 w-5 ml-auto ${selectedExam?.warningCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total warnings received
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="border rounded-lg p-4 mb-2">
            <h3 className="font-medium mb-4">Your Answers</h3>
            <div className="space-y-4">
              {selectedExam?.answers && Object.entries(selectedExam.answers).map(([questionId, answer]: [string, any], index) => {
                // Find question data using questionId
                const question = selectedExam._questions && selectedExam._questions.find((q: any) => q.id === questionId);
                
                return (
                  <Card key={questionId} className="overflow-hidden">
                    <CardHeader className="bg-muted/40 py-3">
                      <CardTitle className="text-sm font-medium flex justify-between">
                        <span>Question {index + 1}</span>
                        <Badge variant={answer === (question?.correctAnswer || '') ? "default" : "destructive"}>
                          {answer === (question?.correctAnswer || '') ? "Correct" : "Incorrect"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="space-y-2">
                        {question ? (
                          <>
                            <p className="text-sm font-medium">{question.text}</p>
                            {question.options && (
                              <div className="ml-2 mt-2 space-y-1">
                                {question.options.map((option: string, i: number) => (
                                  <div key={i} className={`flex items-center text-sm p-1 px-2 rounded-md ${option === answer ? 'bg-primary/10 border border-primary/20' : ''}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 border
                                      ${option === answer && option === question.correctAnswer ? 'bg-green-500 border-green-500 text-white' : 
                                        option === answer ? 'bg-destructive border-destructive text-white' : 
                                        option === question.correctAnswer ? 'border-green-500 text-green-500' : 'border-muted-foreground text-muted-foreground'}`}>
                                      {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className={`${option === question.correctAnswer ? 'text-green-500' : ''}`}>{option}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-muted-foreground italic">Question details not available</p>
                            <div className="mt-2">
                              <p className="text-sm font-medium">Your Answer:</p>
                              <p className="text-sm">{answer}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
