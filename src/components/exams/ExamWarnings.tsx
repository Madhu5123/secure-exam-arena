
import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Warning {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  type: "no_face" | "multiple_faces" | "unclear_face" | "fullscreen_exit";
  imageUrl: string;
  description: string;
}

interface ExamWarningsProps {
  warnings: Warning[];
  isOpen: boolean;
  onClose: () => void;
}

export function ExamWarnings({ warnings, isOpen, onClose }: ExamWarningsProps) {
  const getWarningTypeColor = (type: Warning["type"]) => {
    switch (type) {
      case "no_face":
        return "bg-red-500";
      case "multiple_faces":
        return "bg-yellow-500";
      case "unclear_face":
        return "bg-orange-500";
      case "fullscreen_exit":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Exam Warnings
          </DialogTitle>
          <DialogDescription>
            Review of suspicious activities during the exam
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warnings.map((warning) => (
            <Card key={warning.id} className="overflow-hidden">
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{warning.studentName}</CardTitle>
                  <Badge
                    className={`${getWarningTypeColor(
                      warning.type
                    )} text-white`}
                  >
                    {warning.type.replace("_", " ")}
                  </Badge>
                </div>
                <CardDescription>
                  {format(new Date(warning.timestamp), "PPpp")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="relative aspect-video">
                  <img
                    src={warning.imageUrl}
                    alt={`Warning capture for ${warning.type}`}
                    className="absolute inset-0 w-full h-full object-cover rounded-md"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {warning.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
