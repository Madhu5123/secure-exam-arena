
import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudentCardProps {
  student: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function StudentCard({ student, onEdit, onDelete, isDeleting = false }: StudentCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            {student.profileImage ? (
              <img 
                src={student.profileImage} 
                alt={student.name} 
                className="h-12 w-12 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <UserCircle className="h-12 w-12 text-primary" />
            )}
            <div>
              <h3 className="font-semibold text-lg">{student.name}</h3>
              <p className="text-sm text-muted-foreground">{student.semester || "No semester"}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(student.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={() => onDelete(student.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-6 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm font-medium">{student.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Reg Number:</span>
            <span className="text-sm font-medium">{student.regNumber || "None"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Department:</span>
            <span className="text-sm font-medium">{student.department || "None"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted/50 flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(student.id)}
        >
          Edit Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
