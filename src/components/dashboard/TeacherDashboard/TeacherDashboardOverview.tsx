import { Card } from "@/components/ui/card";
import { BookOpen, Users, Calendar } from "lucide-react";

// Props for analytics cards and filters
type Props = {
  totalExams: number;
  totalAttended: number;
  studentsPassed: number;
  semesters: string[];
  selectedSemester: string;
  setSelectedSemester: (v: string) => void;
  subjects: string[];
  selectedSubject: string;
  setSelectedSubject: (v: string) => void;
  subjectData: { subject: string; count: number }[];
};

export function TeacherDashboardOverview({
  totalExams,
  totalAttended,
  studentsPassed,
  semesters,
  selectedSemester,
  setSelectedSemester,
  subjects,
  selectedSubject,
  setSelectedSubject,
  subjectData,
}: Props) {
  return (
    <div className="space-y-8">
      {/* Analytics cards, modern design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center p-8 rounded-2xl shadow bg-gradient-to-tr from-violet-100 to-indigo-50 border-0 transition-shadow hover:shadow-2xl">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-violet-100 mb-3 shadow-inner">
            <BookOpen size={30} strokeWidth={1.5} className="text-violet-500" />
          </div>
          <div className="text-3xl font-bold text-violet-600">{totalExams}</div>
          <div className="text-sm text-violet-500 mt-1 tracking-wide text-center">Total Exams Created</div>
        </Card>
        <Card className="flex flex-col items-center p-8 rounded-2xl shadow bg-gradient-to-tr from-cyan-100 to-blue-50 border-0 transition-shadow hover:shadow-2xl">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-cyan-100 mb-3 shadow-inner">
            <Calendar size={30} strokeWidth={1.5} className="text-cyan-600" />
          </div>
          <div className="text-3xl font-bold text-cyan-600">{totalAttended}</div>
          <div className="text-sm text-cyan-600 mt-1 tracking-wide text-center">Exam Attended</div>
        </Card>
        <Card className="flex flex-col items-center p-8 rounded-2xl shadow bg-gradient-to-tr from-fuchsia-100 to-pink-50 border-0 transition-shadow hover:shadow-2xl">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-fuchsia-100 mb-3 shadow-inner">
            <Users size={28} strokeWidth={1.5} className="text-fuchsia-400" />
          </div>
          <div className="text-3xl font-bold text-fuchsia-500">{studentsPassed}</div>
          <div className="text-sm text-fuchsia-500 mt-1 tracking-wide text-center">Students Passed</div>
        </Card>
      </div>

      {/* Semesters and Subjects filter */}
      <div className="flex flex-wrap gap-4 items-center mt-2">
        <div>
          <label className="block mb-1 text-sm font-semibold text-muted-foreground">Semester</label>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-violet-200 focus:outline-none"
          >
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-semibold text-muted-foreground">Subject</label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-fuchsia-200 focus:outline-none"
          >
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Chart (keep analysis as before) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="border rounded-lg p-4 bg-white">
          <h2 className="text-lg font-bold mb-4 text-violet-500">Exams by Subject</h2>
          {/* CHARTS will be rendered from parent for now */}
        </Card>
        <Card className="border rounded-lg p-4 bg-white">
          <h2 className="text-lg font-bold mb-4 text-violet-500">Subject Distribution</h2>
          {/* Distribution grid rendered from parent */}
        </Card>
      </div>
    </div>
  );
}
