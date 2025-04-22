
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash, Edit } from "lucide-react";

interface UserCardProps {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  status?: "active" | "inactive";
  additionalInfo?: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function UserCard({ id, name, email, role, status = "active", additionalInfo, onView, onEdit, onDelete }: UserCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
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
        <div className="text-sm">
          <span className="font-medium capitalize">{role}</span>
          {additionalInfo && (
            <p className="text-muted-foreground mt-1">{additionalInfo}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
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
        {onDelete && (
          <Button variant="outline" size="sm" className="text-exam-danger hover:bg-exam-danger/10" onClick={() => onDelete(id)}>
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
