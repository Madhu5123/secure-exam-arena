
import { useEffect, useState } from "react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudentResults } from "@/services/ExamService";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface AnalysisProps {
  studentId: string;
}

export function Analysis({ studentId }: AnalysisProps) {
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    passedExams: 0,
    averageScore: 0
  });

  useEffect(() => {
    const fetchResults = async () => {
      const response = await getStudentResults(studentId);
      if (response.success) {
        setResults(response.results);
        
        // Calculate stats
        const completed = response.results.length;
        const passed = response.results.filter((r: any) => r.percentage >= 40).length;
        const avgScore = response.results.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / (completed || 1);
        
        setStats({
          totalExams: completed,
          completedExams: completed,
          passedExams: passed,
          averageScore: Math.round(avgScore)
        });
      }
    };

    fetchResults();
  }, [studentId]);

  const chartData = results.map(result => ({
    name: result.examTitle,
    score: result.percentage
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">Assigned Exams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedExams}</div>
            <p className="text-xs text-muted-foreground">Exams taken</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passedExams}</div>
            <p className="text-xs text-muted-foreground">Exams passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Your exam scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                score: {
                  theme: {
                    light: "hsl(var(--primary))",
                    dark: "hsl(var(--primary))",
                  },
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary)/.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
