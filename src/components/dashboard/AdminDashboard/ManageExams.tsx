
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Filter, 
  Edit, 
  Trash2, 
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getExamsByDepartmentAndSemester, deleteExam } from "@/services/ExamService";
import { ref, get } from 'firebase/database';
import { db } from "@/config/firebase";

export function ManageExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsRef = ref(db, 'departments');
        const snapshot = await get(departmentsRef);
        
        if (snapshot.exists()) {
          const departmentsList = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }));
          setDepartments(departmentsList);
          
          // Extract all semesters from all departments
          const allSemesters = new Set<string>();
          departmentsList.forEach(dept => {
            if (dept.semesters && Array.isArray(dept.semesters)) {
              dept.semesters.forEach((semester: string) => {
                allSemesters.add(semester);
              });
            }
          });
          
          setSemesters(Array.from(allSemesters).sort());
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast({
          title: "Error",
          description: "Failed to load departments",
          variant: "destructive",
        });
      }
    };
    
    fetchDepartments();
    fetchExams();
  }, []);

  const fetchExams = async (departmentId?: string, semester?: string) => {
    setLoading(true);
    try {
      const response = await getExamsByDepartmentAndSemester(departmentId, semester);
      
      if (response.success) {
        setExams(response.exams);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load exams",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast({
        title: "Error",
        description: "Failed to load exams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    fetchExams(value, selectedSemester);
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    fetchExams(selectedDepartment, value);
  };

  const handleViewExam = (examId: string) => {
    navigate(`/exam/monitor/${examId}`);
  };

  const handleEditExam = (examId: string) => {
    navigate(`/exam/edit/${examId}`);
  };

  const confirmDeleteExam = (exam: any) => {
    setSelectedExam(exam);
    setDeleteDialogOpen(true);
  };

  const handleDeleteExam = async () => {
    if (!selectedExam) return;
    
    try {
      const response = await deleteExam(selectedExam.id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Exam deleted successfully",
        });
        
        // Remove the deleted exam from the list
        setExams(exams.filter(exam => exam.id !== selectedExam.id));
        setDeleteDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete exam",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "expired":
        return <Badge>Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Exams</h2>
          <p className="text-muted-foreground">
            View, edit, and manage all exams across departments
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSemester} onValueChange={handleSemesterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Semesters</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading exams...</p>
            </div>
          ) : exams.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>
                        {departments.find(d => d.id === exam.department)?.name || '-'}
                      </TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>{exam.semester || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {exam.teacherPhoto ? (
                              <AvatarImage src={exam.teacherPhoto} alt={exam.teacherName} />
                            ) : (
                              <AvatarFallback>{exam.teacherName.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-sm">{exam.teacherName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Start: {new Date(exam.startDate).toLocaleDateString()}</p>
                          <p>End: {new Date(exam.endDate).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewExam(exam.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(exam.status === "draft" || exam.status === "scheduled") && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditExam(exam.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => confirmDeleteExam(exam)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No exams found</p>
              <p className="text-sm text-muted-foreground mt-1">Try changing filters or create a new exam</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedExam?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExam}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
