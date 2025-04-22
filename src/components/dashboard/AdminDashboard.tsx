
import { useState, useEffect, useRef } from "react";
import { Users, Settings, PlusCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCard } from "@/components/common/UserCard";
import { StatsCard } from "@/components/common/StatsCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ref, get, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { registerUser } from "@/services/AuthService";
import { uploadToCloudinary } from "@/utils/CloudinaryUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminDashboard() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ 
    name: "", 
    email: "", 
    subject: "", 
    password: "",
    department: "",
    profileImage: "" 
  });
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const teachersRef = ref(db, 'users');
      const departmentsRef = ref(db, 'departments');
      
      const [teachersSnapshot, departmentsSnapshot] = await Promise.all([
        get(teachersRef),
        get(departmentsRef)
      ]);
      
      if (teachersSnapshot.exists()) {
        const teachersList: any[] = [];
        teachersSnapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'teacher') {
            teachersList.push({
              id: childSnapshot.key,
              ...userData,
              status: 'active',
            });
          }
        });
        setTeachers(teachersList);
      }

      if (departmentsSnapshot.exists()) {
        const departmentsList = Object.entries(departmentsSnapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }));
        setDepartments(departmentsList);
      }
    };

    fetchData();
  }, []);

  const handleDepartmentChange = async (departmentId: string) => {
    setNewTeacher({ ...newTeacher, department: departmentId, subject: "" });
    
    if (!departmentId) {
      setSubjects([]);
      return;
    }
    
    try {
      const subjectsRef = ref(db, `departments/${departmentId}/subjects`);
      const snapshot = await get(subjectsRef);
      
      if (snapshot.exists()) {
        const allSubjects: any[] = [];
        const subjectsData = snapshot.val();
        
        // Flatten the subjects from all semesters
        Object.entries(subjectsData).forEach(([semester, semesterSubjects]: [string, any]) => {
          semesterSubjects.forEach((subject: any) => {
            allSubjects.push({
              ...subject,
              semester
            });
          });
        });
        
        setSubjects(allSubjects);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfileImageFile(file);
      
      try {
        setUploadingImage(true);
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(file);
        setUploadedImageUrl(imageUrl);
        setNewTeacher({ ...newTeacher, profileImage: imageUrl });
        toast({
          title: "Image uploaded",
          description: "Profile image has been uploaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password || !newTeacher.department || !newTeacher.subject) {
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
        const departmentRef = ref(db, `departments/${newTeacher.department}/teachers`);
        const snapshot = await get(departmentRef);
        const currentTeachers = snapshot.exists() ? snapshot.val() : [];
        await set(departmentRef, [...currentTeachers, user.id]);

        await set(ref(db, `users/${user.id}`), {
          name: user.name,
          email: user.email,
          role: "teacher",
          subject: newTeacher.subject,
          department: newTeacher.department,
          profileImage: newTeacher.profileImage,
        });

        toast({
          title: "Teacher added",
          description: `${newTeacher.name} has been added successfully.`,
        });

        setNewTeacher({ 
          name: "", 
          email: "", 
          subject: "", 
          password: "",
          department: "",
          profileImage: "" 
        });
        setProfileImageFile(null);
        setUploadedImageUrl("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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
    const teacher = teachers.find((teacher) => teacher.id === id);
    if (teacher) {
      setSelectedTeacher(teacher);
      setIsViewDialogOpen(true);
    }
  };

  const handleEditTeacher = (id: string) => {
    const teacher = teachers.find((teacher) => teacher.id === id);
    if (teacher) {
      setSelectedTeacher(teacher);
      setNewTeacher({
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        password: "",
        department: teacher.department,
        profileImage: teacher.profileImage
      });
      setUploadedImageUrl(teacher.profileImage || "");
      setIsEditDialogOpen(true);
      
      if (teacher.department) {
        handleDepartmentChange(teacher.department);
      }
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher || !newTeacher.name || !newTeacher.email || !newTeacher.department || !newTeacher.subject) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates: any = {
        name: newTeacher.name,
        email: newTeacher.email,
        subject: newTeacher.subject,
        department: newTeacher.department,
      };
      
      if (newTeacher.profileImage) {
        updates.profileImage = newTeacher.profileImage;
      }
      
      // Update user data
      await set(ref(db, `users/${selectedTeacher.id}`), {
        ...selectedTeacher,
        ...updates
      });
      
      // If department changed, update department references
      if (selectedTeacher.department !== newTeacher.department) {
        // Remove from old department
        const oldDeptRef = ref(db, `departments/${selectedTeacher.department}/teachers`);
        const oldSnapshot = await get(oldDeptRef);
        if (oldSnapshot.exists()) {
          const oldTeachers = oldSnapshot.val();
          await set(oldDeptRef, oldTeachers.filter((id: string) => id !== selectedTeacher.id));
        }
        
        // Add to new department
        const newDeptRef = ref(db, `departments/${newTeacher.department}/teachers`);
        const newSnapshot = await get(newDeptRef);
        const newTeachers = newSnapshot.exists() ? newSnapshot.val() : [];
        await set(newDeptRef, [...newTeachers, selectedTeacher.id]);
      }

      toast({
        title: "Teacher updated",
        description: `${newTeacher.name}'s information has been updated.`,
      });

      // Refresh the teachers list
      const teachersRef = ref(db, 'users');
      const teachersSnapshot = await get(teachersRef);
      if (teachersSnapshot.exists()) {
        const teachersList: any[] = [];
        teachersSnapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'teacher') {
            teachersList.push({
              id: childSnapshot.key,
              ...userData,
              status: 'active',
            });
          }
        });
        setTeachers(teachersList);
      }

      setIsEditDialogOpen(false);
      setSelectedTeacher(null);
      setNewTeacher({ 
        name: "", 
        email: "", 
        subject: "", 
        password: "",
        department: "",
        profileImage: "" 
      });
      setUploadedImageUrl("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update teacher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const teacher = teachers.find((t) => t.id === id);
      if (teacher && teacher.department) {
        // Remove from department
        const deptRef = ref(db, `departments/${teacher.department}/teachers`);
        const snapshot = await get(deptRef);
        if (snapshot.exists()) {
          const deptTeachers = snapshot.val();
          await set(deptRef, deptTeachers.filter((teacherId: string) => teacherId !== id));
        }
      }
      
      // Delete user
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
                  <Label htmlFor="profileImage">Profile Image</Label>
                  <div className="flex gap-2 items-center">
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center"
                      disabled={uploadingImage}
                    >
                      <Upload className="h-4 w-4 mr-2" /> 
                      {uploadingImage ? 'Uploading...' : profileImageFile ? 'Change Image' : 'Upload Image'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageUpload}
                    />
                  </div>
                  {uploadedImageUrl && (
                    <div className="mt-2">
                      <img 
                        src={uploadedImageUrl} 
                        alt="Profile preview" 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  )}
                  {profileImageFile && !uploadedImageUrl && (
                    <div className="text-sm text-muted-foreground">
                      Selected: {profileImageFile.name}
                    </div>
                  )}
                </div>
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
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={newTeacher.department}
                    onValueChange={(value) => handleDepartmentChange(value)}
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
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={newTeacher.subject}
                    onValueChange={(value) => setNewTeacher({ ...newTeacher, subject: value })}
                    disabled={!newTeacher.department || subjects.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={subjects.length === 0 ? "No subjects available" : "Select Subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.semester})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button onClick={handleAddTeacher} disabled={uploadingImage}>Add Teacher</Button>
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
              additionalInfo={subjects.find(s => s.id === teacher.subject)?.name || teacher.subject}
              profileImage={teacher.profileImage}
              department={departments.find(d => d.id === teacher.department)?.name}
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

      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedTeacher.profileImage ? (
                  <img 
                    src={selectedTeacher.profileImage} 
                    alt={`${selectedTeacher.name}'s profile`} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <div className="p-2 bg-muted rounded">{selectedTeacher.name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <div className="p-2 bg-muted rounded">{selectedTeacher.email}</div>
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <div className="p-2 bg-muted rounded">
                  {departments.find(d => d.id === selectedTeacher.department)?.name || "Not assigned"}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <div className="p-2 bg-muted rounded">
                  {subjects.find(s => s.id === selectedTeacher.subject)?.name || selectedTeacher.subject || "Not assigned"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-profileImage">Profile Image</Label>
              <div className="flex gap-2 items-center">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center"
                  disabled={uploadingImage}
                >
                  <Upload className="h-4 w-4 mr-2" /> 
                  {uploadingImage ? 'Uploading...' : 'Change Image'}
                </Button>
                <input
                  ref={fileInputRef}
                  id="edit-profileImage"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                />
              </div>
              {uploadedImageUrl && (
                <div className="mt-2">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Profile preview" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={newTeacher.department}
                onValueChange={(value) => handleDepartmentChange(value)}
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
              <Label htmlFor="edit-subject">Subject</Label>
              <Select
                value={newTeacher.subject}
                onValueChange={(value) => setNewTeacher({ ...newTeacher, subject: value })}
                disabled={!newTeacher.department || subjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={subjects.length === 0 ? "No subjects available" : "Select Subject"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTeacher} disabled={uploadingImage}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
