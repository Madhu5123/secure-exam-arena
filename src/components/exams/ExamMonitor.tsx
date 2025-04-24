
import { useState, useEffect, ChangeEvent } from 'react';
import { getExamById, getExamSubmissions } from '@/services/ExamService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface ExamMonitorProps {
  examId?: string;
}

interface Student {
  id: string;
  name: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  startTime?: string;
  endTime?: string;
  answers?: Record<string, string>;
  warningCount?: number;
  status: 'completed' | 'in-progress' | 'not-started';
}

export function ExamMonitor({ examId }: ExamMonitorProps) {
  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        
        // Fetch submissions
        const submissionsResult = await getExamSubmissions(examId);
        
        const studentsData: Student[] = [];
        
        // Get assigned students and submissions
        if (examResult.exam.assignedStudents) {
          for (const studentId of examResult.exam.assignedStudents) {
            const submission = submissionsResult.success ? 
              submissionsResult.submissions.find((sub: any) => sub.studentId === studentId) : 
              null;
            
            if (submission) {
              // Student has a submission
              const startTime = new Date(submission.startTime);
              const endTime = new Date(submission.endTime);
              const timeTaken = (endTime.getTime() - startTime.getTime()) / 60000; // in minutes
              
              studentsData.push({
                id: studentId,
                name: submission.studentName || `Student ${studentId.slice(-4)}`,
                score: submission.score || 0,
                maxScore: submission.maxScore || 0,
                percentage: submission.percentage || 0,
                startTime: startTime.toLocaleString(),
                endTime: endTime.toLocaleString(),
                answers: submission.answers,
                warningCount: submission.warningCount || 0,
                status: 'completed',
                timeTaken: Math.round(timeTaken * 10) / 10 // Round to 1 decimal
              });
            } else {
              // Student hasn't taken the exam
              studentsData.push({
                id: studentId,
                name: `Student ${studentId.slice(-4)}`,
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{student.name}</td>
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
                                (student.percentage || 0) >= 70 ? 'text-green-600' : 
                                (student.percentage || 0) >= 40 ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}>
                                {student.percentage}%
                              </span> : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              `${student.timeTaken} min` : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              student.warningCount : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-muted-foreground">
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
                    {students.filter(s => s.status === 'completed').length > 0
                      ? Math.round(students.filter(s => s.status === 'completed')
                          .reduce((sum, s) => sum + (s.percentage || 0), 0) / 
                          students.filter(s => s.status === 'completed').length)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {students.filter(s => s.percentage && s.percentage >= 40).length} passing students
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
    </div>
  );
}
