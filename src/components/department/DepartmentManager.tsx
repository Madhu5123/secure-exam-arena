
import React, { useState, useEffect } from "react";
import { Plus, Folder, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ref, get, push, set } from 'firebase/database';
import { db } from '@/config/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DepartmentCard } from "./DepartmentCard";

interface Department {
  id: string;
  name: string;
  semesters: string[];
  teachers: string[];
}

export function DepartmentManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: "", semesters: [] });
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
        teachers: []
      });

      toast({
        title: "Department added",
        description: "The department has been added successfully.",
      });

      setNewDepartment({ name: "", semesters: [] });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Departments</h2>
          <p className="text-muted-foreground">Manage academic departments and semesters</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((department) => (
          <DepartmentCard
            key={department.id}
            department={department}
            onUpdate={fetchDepartments}
          />
        ))}
      </div>
    </div>
  );
}
