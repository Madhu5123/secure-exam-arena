import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

interface UserCardProps {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  status?: "active" | "inactive";
  additionalInfo?: string;
  profileImage?: string;
  department?: string;
  semester?: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function UserCard({ 
  id, 
  name, 
  email, 
  role, 
  status = "active", 
  additionalInfo,
  profileImage,
  department,
  semester,
  onView, 
  onEdit, 
  onDelete 
}: UserCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        {profileImage && (
          <div className="w-16 h-16 rounded-full overflow-hidden mb-4">
            <img 
              src={profileImage} 
              alt={`${name}'s profile`} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{name}</CardTitle>
            <CardDescription>{email}</CardDescription>
          </div>
          <Badge 
            variant={status === "active" ? "default" : "secondary"}
            className={status === "active" ? "bg-exam-success" : "bg-exam-warning"}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2">
          <div>
            <span className="font-medium capitalize">{role}</span>
            {additionalInfo && (
              <p className="text-muted-foreground mt-1">{additionalInfo}</p>
            )}
          </div>
          {department && (
            <div className="text-muted-foreground">
              Department: {department}
            </div>
          )}
          {semester && (
            <div className="text-muted-foreground">
              Semester: {semester}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {onView && (
          <Button variant="outline" size="sm" onClick={() => onView(id)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {role}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
