
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
      <Table>
        <TableCaption>A list of your exam results.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Exam Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Warnings</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.examId}>
              <TableCell className="font-medium">{result.examTitle}</TableCell>
              <TableCell>{result.examSubject}</TableCell>
              <TableCell>{result.score}/{result.maxScore}</TableCell>
              <TableCell>{result.percentage}%</TableCell>
              <TableCell>{result.warningCount}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
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
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedExam?.examTitle} - Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedExam?.answers && Object.entries(selectedExam.answers).map(([questionId, answer]: [string, any]) => (
              <div key={questionId} className="space-y-2 p-4 border rounded-lg">
                <p className="font-medium">Question: {questionId}</p>
                <p className="text-muted-foreground">Your Answer: {answer}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
