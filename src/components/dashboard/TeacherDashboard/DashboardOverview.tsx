
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/common/StatsCard";
import { BookOpen, FileText, Users } from "lucide-react";

interface DashboardOverviewProps {
  exams?: any[];
  students?: any[];
}

export function DashboardOverview({ exams = [], students = [] }: DashboardOverviewProps) {
  const totalExams = exams.length;
  const totalStudents = students.length;
  const completedExams = exams.filter(exam => exam.status === "completed").length;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome to your teacher dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Exams"
          value={totalExams}
          description="Created exams"
          trend="up"
          icon={<FileText className="text-blue-500" />}
        />
        <StatsCard
          title="Students"
          value={totalStudents}
          description="Registered students"
          trend="up"
          icon={<Users className="text-green-500" />}
        />
        <StatsCard
          title="Completed Exams"
          value={completedExams}
          description="Finished exams"
          trend="neutral"
          icon={<BookOpen className="text-amber-500" />}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest exam activity</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <div className="space-y-4">
              {exams.slice(0, 3).map((exam, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-medium">{exam.title}</p>
                  <div className="text-sm text-muted-foreground">{exam.subject} • {exam.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent exam activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
