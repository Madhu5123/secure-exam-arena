import { useState, useEffect } from "react";
import { PlusCircle, MessageSquare, CalendarIcon, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ref, push, onValue, remove } from "firebase/database";
import { db } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";
import { fetchAcademicData } from "@/services/AcademicService";
import { format } from "date-fns";

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  semester: string;
  department: string;
  createdBy: string;
  createdAt: string;
  teacherName: string;
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
    type: "academic",
    semester: "",
  });
  const [teacherDepartment, setTeacherDepartment] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem("examUser");
    if (user) {
      const userData = JSON.parse(user);
      
      // Fetch teacher information
      const teacherRef = ref(db, `users/${userData.id}`);
      onValue(teacherRef, (snapshot) => {
        if (snapshot.exists()) {
          const teacherData = snapshot.val();
          setTeacherDepartment(teacherData.department || "");
          setTeacherName(teacherData.name || "");
        }
      });
      
      // Fetch notices
      const noticesRef = ref(db, "notices");
      onValue(noticesRef, (snapshot) => {
        if (snapshot.exists()) {
          const noticesList: Notice[] = [];
          snapshot.forEach((childSnapshot) => {
            const noticeData = childSnapshot.val();
            // Only show notices from the teacher's department
            if (noticeData.department === teacherDepartment || !teacherDepartment) {
              noticesList.push({
                id: childSnapshot.key as string,
                ...noticeData,
              });
            }
          });
          // Sort by created date, newest first
          noticesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotices(noticesList);
        }
      });
    }
  }, [teacherDepartment]);

  useEffect(() => {
    const loadAcademicData = async () => {
      if (teacherDepartment) {
        const data = await fetchAcademicData(teacherDepartment);
        setAvailableSemesters(data.semesters);
        // Set default semester for new notice
        if (data.semesters.length > 0) {
          setNewNotice(prev => ({ ...prev, semester: data.semesters[0] }));
        }
      }
    };

    loadAcademicData();
  }, [teacherDepartment]);

  const handleAddNotice = () => {
    const user = localStorage.getItem("examUser");
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a notice",
        variant: "destructive",
      });
      return;
    }

    if (!newNotice.title || !newNotice.content || !newNotice.semester) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const userData = JSON.parse(user);
    const noticesRef = ref(db, "notices");
    
    const noticeData = {
      ...newNotice,
      department: teacherDepartment,
      createdBy: userData.id,
      createdAt: new Date().toISOString(),
      teacherName: teacherName,
    };

    push(noticesRef, noticeData)
      .then(() => {
        toast({
          title: "Notice added",
          description: "The notice has been published successfully",
        });
        setIsDialogOpen(false);
        setNewNotice({
          title: "",
          content: "",
          type: "academic",
          semester: availableSemesters.length > 0 ? availableSemesters[0] : "",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to add notice. Please try again.",
          variant: "destructive",
        });
        console.error("Error adding notice:", error);
      });
  };

  const handleDeleteNotice = (id: string) => {
    const noticeRef = ref(db, `notices/${id}`);
    remove(noticeRef)
      .then(() => {
        toast({
          title: "Notice deleted",
          description: "The notice has been deleted successfully",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to delete notice. Please try again.",
          variant: "destructive",
        });
        console.error("Error deleting notice:", error);
      });
  };

  const filteredNotices = notices.filter(notice => {
    return selectedType === "all" || notice.type === selectedType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notice Board</h2>
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notices</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Notice</DialogTitle>
                <DialogDescription>
                  Create a new notice to inform students about important information.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="noticeTitle">Title</Label>
                  <Input
                    id="noticeTitle"
                    value={newNotice.title}
                    onChange={(e) =>
                      setNewNotice({ ...newNotice, title: e.target.value })
                    }
                    placeholder="Enter notice title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="noticeType">Type</Label>
                    <Select
                      value={newNotice.type}
                      onValueChange={(value) =>
                        setNewNotice({ ...newNotice, type: value })
                      }
                    >
                      <SelectTrigger id="noticeType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="noticeSemester">Semester</Label>
                    <Select
                      value={newNotice.semester}
                      onValueChange={(value) =>
                        setNewNotice({ ...newNotice, semester: value })
                      }
                    >
                      <SelectTrigger id="noticeSemester">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSemesters.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="noticeContent">Content</Label>
                  <Textarea
                    id="noticeContent"
                    value={newNotice.content}
                    onChange={(e) =>
                      setNewNotice({ ...newNotice, content: e.target.value })
                    }
                    placeholder="Enter notice content"
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNotice}>Publish Notice</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredNotices.length > 0 ? (
        <div className="grid gap-4">
          {filteredNotices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{notice.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Badge
                        className={`${
                          notice.type === "exam"
                            ? "bg-red-100 text-red-800"
                            : notice.type === "academic"
                            ? "bg-blue-100 text-blue-800"
                            : notice.type === "event"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {notice.type}
                      </Badge>
                      <span>|</span>
                      <span>{notice.semester}</span>
                      <span>|</span>
                      <span>
                        Posted:{" "}
                        {format(new Date(notice.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{notice.content}</p>
              </CardContent>
              <CardFooter className="border-t pt-2 text-sm text-muted-foreground">
                Posted by: {notice.teacherName}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {selectedType === "all"
                ? "No notices available."
                : `No ${selectedType} notices available.`}
            </p>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="mt-4"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First Notice
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
