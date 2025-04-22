
import React, { useState, useEffect } from "react";
import { Plus, Folder, Calendar, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ref, get, push, set } from 'firebase/database';
import { db } from '@/config/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DepartmentCard } from "./DepartmentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: string;
}

interface Department {
  id: string;
  name: string;
  semesters: string[];
  teachers: string[];
  subjects?: Record<string, Subject[]>;
}

export function DepartmentManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddSemesterDialogOpen, setIsAddSemesterDialogOpen] = useState(false);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: "" });
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newSemester, setNewSemester] = useState("");
  const [newSubject, setNewSubject] = useState({ name: "", code: "", semester: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const departmentsRef = ref(db, 'departments');
    const snapshot = await get(departmentsRef);
    
    if (snapshot.exists()) {
      const departmentsList = Object.entries(snapshot.val()).map(([id, data]) => ({
        id,
        ...(data as Omit<Department, 'id'>),
      }));
      setDepartments(departmentsList);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name) {
      toast({
        title: "Missing information",
        description: "Please fill in the department name",
        variant: "destructive",
      });
      return;
    }

    try {
      const departmentsRef = ref(db, 'departments');
      const newDepartmentRef = push(departmentsRef);
      await set(newDepartmentRef, {
        name: newDepartment.name,
        semesters: [],
        teachers: [],
        subjects: {}
      });

      toast({
        title: "Department added",
        description: "The department has been added successfully.",
      });

      setNewDepartment({ name: "" });
      setIsAddDialogOpen(false);
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add department. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddSemester = async () => {
    if (!newSemester || !selectedDepartment) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const semestersRef = ref(db, `departments/${selectedDepartment.id}/semesters`);
      const semestersSnapshot = await get(semestersRef);
      const currentSemesters = semestersSnapshot.exists() ? semestersSnapshot.val() : [];
      
      if (currentSemesters.includes(newSemester)) {
        toast({
          title: "Semester exists",
          description: "This semester already exists in the department.",
          variant: "destructive",
        });
        return;
      }
      
      await set(semestersRef, [...currentSemesters, newSemester]);

      toast({
        title: "Semester added",
        description: `${newSemester} has been added to ${selectedDepartment.name} department.`,
      });

      setNewSemester("");
      setIsAddSemesterDialogOpen(false);
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add semester. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.semester || !selectedDepartment) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const subjectRef = ref(db, `departments/${selectedDepartment.id}/subjects`);
      const subjectSnapshot = await get(subjectRef);
      const currentSubjects = subjectSnapshot.exists() ? subjectSnapshot.val() : {};
      
      // Create semester key if it doesn't exist
      if (!currentSubjects[newSubject.semester]) {
        currentSubjects[newSubject.semester] = [];
      }
      
      // Create a new subject
      const newSubjectData = {
        id: Date.now().toString(),
        name: newSubject.name,
        code: newSubject.code,
        semester: newSubject.semester
      };
      
      currentSubjects[newSubject.semester].push(newSubjectData);
      
      await set(subjectRef, currentSubjects);

      toast({
        title: "Subject added",
        description: `${newSubject.name} has been added to ${selectedDepartment.name} department.`,
      });

      setNewSubject({ name: "", code: "", semester: "" });
      setIsAddSubjectDialogOpen(false);
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subject. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Departments</h2>
          <p className="text-muted-foreground">Manage academic departments, semesters and subjects</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDepartment}>Add Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="semester">Semesters</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="departments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                onUpdate={fetchDepartments}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="semester" className="space-y-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Manage Semesters</h3>
            <Dialog open={isAddSemesterDialogOpen} onOpenChange={setIsAddSemesterDialogOpen}>
              <Button onClick={() => setIsAddSemesterDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Semester
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Semester</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      onValueChange={(value) => {
                        const dept = departments.find(d => d.id === value);
                        setSelectedDepartment(dept || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="semester">Semester Name</Label>
                    <Input
                      id="semester"
                      value={newSemester}
                      onChange={(e) => setNewSemester(e.target.value)}
                      placeholder="e.g. Semester 1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddSemesterDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddSemester}>Add Semester</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-4">
            {departments.map((department) => (
              <div key={department.id} className="border rounded-lg p-4">
                <h4 className="text-md font-semibold mb-2">{department.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {department.semesters && department.semesters.length > 0 ? (
                    department.semesters.map((semester, index) => (
                      <div key={index} className="bg-muted rounded-md p-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{semester}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full">No semesters added yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Manage Subjects</h3>
            <Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}>
              <Button onClick={() => setIsAddSubjectDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subject-department">Department</Label>
                    <Select 
                      onValueChange={(value) => {
                        const dept = departments.find(d => d.id === value);
                        setSelectedDepartment(dept || null);
                        setNewSubject({ ...newSubject, semester: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedDepartment && (
                    <div className="grid gap-2">
                      <Label htmlFor="subject-semester">Semester</Label>
                      <Select 
                        value={newSubject.semester}
                        onValueChange={(value) => setNewSubject({ ...newSubject, semester: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedDepartment.semesters && selectedDepartment.semesters.map((semester, index) => (
                            <SelectItem key={index} value={semester}>{semester}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="subject-name">Subject Name</Label>
                    <Input
                      id="subject-name"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="subject-code">Subject Code</Label>
                    <Input
                      id="subject-code"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddSubjectDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddSubject}>Add Subject</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-4">
            {departments.map((department) => (
              <div key={department.id} className="border rounded-lg p-4">
                <h4 className="text-md font-semibold mb-2">{department.name}</h4>
                
                {department.subjects ? (
                  Object.entries(department.subjects).map(([semester, subjects]) => (
                    <div key={semester} className="mb-4">
                      <h5 className="text-sm font-medium text-muted-foreground mb-2">{semester}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {subjects.map((subject: Subject) => (
                          <div key={subject.id} className="bg-muted rounded-md p-3 flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <Book className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="font-medium">{subject.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Code: {subject.code}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No subjects added yet.</p>
                )}
                
                {department.subjects && Object.keys(department.subjects).length === 0 && (
                  <p className="text-muted-foreground">No subjects added yet.</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
