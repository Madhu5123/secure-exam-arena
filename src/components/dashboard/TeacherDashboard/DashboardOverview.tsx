
import { StatsCard } from "@/components/common/StatsCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";

export interface DashboardOverviewProps {
  totalExams: number;
  totalAttended: number;
  studentsPassed: number;
  selectedSemester: string;
  totalStudents: number;
  activeStudents: number;
  exams: any[];
  subjectData: { subject: string; count: number }[];
  availableSemesters: string[];
  setSelectedSemester: (semester: string) => void;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
  availableSubjects: string[];
}

export function DashboardOverview({
  totalExams,
  totalAttended,
  studentsPassed,
  selectedSemester,
  totalStudents,
  activeStudents,
  exams,
  subjectData,
  availableSemesters,
  setSelectedSemester,
  selectedSubject,
  setSelectedSubject,
  availableSubjects
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to your exam dashboard</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {availableSemesters.map(semester => (
                <SelectItem key={semester} value={semester}>{semester}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Students" 
          value={totalStudents} 
          description={`${activeStudents} active`}
          type="students"
        />
        <StatsCard 
          title="Total Exams" 
          value={totalExams} 
          description={`${selectedSemester === "All" ? "All semesters" : selectedSemester}`}
          type="exams"
        />
        <StatsCard 
          title="Exams Taken" 
          value={totalAttended} 
          description="Total submissions"
          type="submissions"
        />
        <StatsCard 
          title="Students Passed" 
          value={studentsPassed} 
          description={`${((studentsPassed / totalStudents) * 100).toFixed(0)}% pass rate`}
          type="passed"
        />
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Exams by Subject</h3>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Exams</h3>
          {exams.slice(0, 5).map((exam, index) => (
            <div key={exam.id || index} className="py-2 border-b last:border-0">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{exam.title}</p>
                  <p className="text-sm text-muted-foreground">{exam.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{exam.date}</p>
                  <p className="text-sm text-muted-foreground capitalize">{exam.status}</p>
                </div>
              </div>
            </div>
          ))}
          {exams.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No exams available</p>
          )}
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-semibold">72%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-semibold">
                {exams.length > 0 
                  ? `${Math.round((totalAttended / (totalStudents * exams.length)) * 100)}%`
                  : "0%"
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-semibold">
                {exams.reduce((sum, exam) => sum + (exam.questions?.length || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
