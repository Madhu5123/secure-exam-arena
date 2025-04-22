import { useState, useEffect } from "react";
import { Users, Settings, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCard } from "@/components/common/UserCard";
import { StatsCard } from "@/components/common/StatsCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ref, get, push, set } from 'firebase/database';
import { db } from '@/config/firebase';
import { registerUser } from "@/services/AuthService";

export function AdminDashboard() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", email: "", subject: "", password: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeachers = async () => {
      const teachersRef = ref(db, 'users');
      const snapshot = await get(teachersRef);
      
      if (snapshot.exists()) {
        const teachersList: any[] = [];
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'teacher') {
            teachersList.push({
              id: childSnapshot.key,
              ...userData,
              status: 'active', // Default status
            });
          }
        });
        setTeachers(teachersList);
      }
    };

    fetchTeachers();
  }, []);

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { success, user, error } = await registerUser(
        newTeacher.name,
        newTeacher.email,
        newTeacher.password,
        "teacher"
      );

      if (success && user) {
        toast({
          title: "Teacher added",
          description: `${newTeacher.name} has been added successfully.`,
        });

        // Add the new teacher to the list
        setTeachers([
          ...teachers,
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: "teacher",
            status: "active",
            additionalInfo: newTeacher.subject,
          },
        ]);

        // Reset form and close dialog
        setNewTeacher({ name: "", email: "", subject: "", password: "" });
        setIsAddDialogOpen(false);
      } else {
        toast({
          title: "Failed to add teacher",
          description: error || "An error occurred while adding the teacher.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add teacher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewTeacher = (id: string) => {
    toast({
      title: "View Teacher",
      description: `Viewing teacher with ID: ${id}`,
    });
  };

  const handleEditTeacher = (id: string) => {
    toast({
      title: "Edit Teacher",
      description: `Editing teacher with ID: ${id}`,
    });
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await set(ref(db, `users/${id}`), null);
      setTeachers(teachers.filter((teacher) => teacher.id !== id));
      toast({
        title: "Teacher deleted",
        description: "The teacher has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete teacher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        <StatsCard
          title="Total Teachers"
          value={teachers.length}
          description="Active faculty members"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Teachers"
          value={teachers.filter((t) => t.status === "active").length}
          description="Currently teaching"
          trend="up"
          trendValue="+2 this month"
        />
        <StatsCard
          title="System Status"
          value="Operational"
          description="All systems running"
          trend="neutral"
          trendValue="Normal"
          icon={<Settings className="h-4 w-4" />}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Teachers</h2>
          <p className="text-muted-foreground">Add, edit or remove teacher accounts</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:w-64"
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Create a new teacher account. They will receive login credentials via email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject/Department</Label>
                  <Input
                    id="subject"
                    value={newTeacher.subject}
                    onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTeacher}>Add Teacher</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => (
            <UserCard
              key={teacher.id}
              id={teacher.id}
              name={teacher.name}
              email={teacher.email}
              role="teacher"
              status={teacher.status}
              additionalInfo={teacher.additionalInfo}
              onView={handleViewTeacher}
              onEdit={handleEditTeacher}
              onDelete={handleDeleteTeacher}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No teachers found. Add a new teacher to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
