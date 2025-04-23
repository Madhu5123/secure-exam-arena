
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Book, Users, Calendar } from "lucide-react";

type Props = {
  totalExams: number;
  totalAttended: number;
  studentsPassed: number;
  selectedSemester: string;
  selectedSubject: string;
  setSelectedSemester: (v: string) => void;
  setSelectedSubject: (v: string) => void;
  SEMESTERS: string[];
  availableSubjects: string[];
  subjectData: { subject: string; count: number }[];
};
export function DashboardOverview({
  totalExams,
  totalAttended,
  studentsPassed,
  selectedSemester,
  selectedSubject,
  setSelectedSemester,
  setSelectedSubject,
  SEMESTERS,
  availableSubjects,
  subjectData,
}: Props) {
  return (
    <div className="space-y-8">
      {/* Analytics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center p-6 rounded-2xl shadow bg-gradient-to-br from-[#F1F0FB] to-[#E5DEFF] border-none">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#f4f0fa] mb-2 shadow-inner">
            <Book size={28} strokeWidth={1.5} className="text-[#9b87f5]" />
          </div>
          <div className="text-2xl font-semibold text-[#9b87f5]">{totalExams}</div>
          <div className="text-xs text-[#7E69AB] mt-1 tracking-wide text-center">Total Exams Created</div>
        </Card>
        <Card className="flex flex-col items-center p-6 rounded-2xl shadow bg-gradient-to-br from-[#E7F4FB] to-[#D3E4FD] border-none">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#e5fafd] mb-2 shadow-inner">
            <Calendar size={28} strokeWidth={1.5} className="text-[#33C3F0]" />
          </div>
          <div className="text-2xl font-semibold text-[#33C3F0]">{totalAttended}</div>
          <div className="text-xs text-[#6E59A5] mt-1 tracking-wide text-center">Exam Attended</div>
        </Card>
        <Card className="flex flex-col items-center p-6 rounded-2xl shadow bg-gradient-to-br from-[#EDE7FB] to-[#F1F0FB] border-none">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#ede7fb] mb-2 shadow-inner">
            <Users size={26} strokeWidth={1.5} className="text-[#7E69AB]" />
          </div>
          <div className="text-2xl font-semibold text-[#7E69AB]">{studentsPassed}</div>
          <div className="text-xs text-[#a497d7] mt-1 tracking-wide text-center">Students Passed</div>
        </Card>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mt-2">
        <div>
          <label className="block mb-1 text-sm font-semibold">Semester</label>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="border rounded px-4 py-2 bg-background"
          >
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-semibold">Subject</label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="border rounded px-4 py-2 bg-background"
          >
            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border rounded-lg p-4 bg-white">
          <h2 className="text-lg font-bold mb-4 text-[#7E69AB]">Exams by Subject</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={subjectData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="subject" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#9b87f5" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="border rounded-lg p-4 bg-white">
          <h2 className="text-lg font-bold mb-4 text-[#7E69AB]">Subject Distribution</h2>
          <div className="grid grid-cols-2 gap-3">
            {subjectData.map(({ subject, count }) => (
              <div key={subject} className="bg-[#F1F0FB] p-3 rounded flex flex-col items-center shadow">
                <span className="font-semibold text-[#6E59A5]">{subject}</span>
                <span className="text-2xl text-[#9b87f5]">{count}</span>
                <span className="text-xs text-muted-foreground">exams</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
