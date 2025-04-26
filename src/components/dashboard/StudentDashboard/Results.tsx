
import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getStudentResults } from "@/services/ExamService";

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

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {results.map((result) => (
          <Card key={result.examId} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">{result.examTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">{result.examSubject}</p>
                </div>
                <Badge variant={result.percentage >= 40 ? "default" : "destructive"}>
                  {result.percentage}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="grid gap-1">
                    <p className="text-muted-foreground">Score</p>
                    <p className="font-medium">{result.score}/{result.maxScore}</p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-muted-foreground">Warnings</p>
                    <p className="font-medium">{result.warningCount}</p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="outline">{result.percentage >= 40 ? "Passed" : "Failed"}</Badge>
                  </div>
                </div>
                <Progress value={result.percentage} className="h-2" />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-[100px]"
                    onClick={() => {
                      setSelectedExam(result);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedExam?.examTitle} - Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Final Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedExam?.percentage}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Time Taken</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {selectedExam?.endTime && selectedExam?.startTime 
                      ? Math.round((new Date(selectedExam.endTime).getTime() - new Date(selectedExam.startTime).getTime()) / 60000)
                      : 0} mins
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Warnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedExam?.warningCount}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              {selectedExam?.answers && Object.entries(selectedExam.answers).map(([questionId, answer]: [string, any]) => (
                <Card key={questionId} className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/40">
                    <CardTitle className="text-sm font-medium">Question {questionId}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Your Answer:</p>
                      <p className="text-sm text-muted-foreground">{answer}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
