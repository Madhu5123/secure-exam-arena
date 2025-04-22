
// This is a mock exam service that simulates Firebase Realtime Database
// In a real implementation, this would use Firebase Realtime Database

import { checkUserRole } from "./AuthService";

interface Exam {
  id: string;
  title: string;
  subject: string;
  createdBy: string;
  date: string;
  time: string;
  duration: number;
  status: "draft" | "scheduled" | "active" | "completed";
  questions: Question[];
  assignedStudents: string[];
}

interface Question {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  text: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
}

interface ExamSubmission {
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  startTime: string;
  endTime: string;
  score: number;
  maxScore: number;
  warningCount: number;
}

// Mock exams database
const exams: Exam[] = [
  {
    id: "exam1",
    title: "Mid-term Mathematics",
    subject: "Mathematics",
    createdBy: "teacher1",
    date: "2025-05-10",
    time: "10:00",
    duration: 120,
    status: "scheduled",
    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        text: "What is the value of x in the equation 2x + 5 = 15?",
        options: ["x = 3", "x = 5", "x = 7", "x = 10"],
        correctAnswer: "1",
        points: 2,
      },
      // More questions...
    ],
    assignedStudents: ["student1", "student2"],
  },
  // More exams...
];

// Mock submissions database
const submissions: ExamSubmission[] = [];

export const getExamsForTeacher = async (teacherId: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Filter exams created by this teacher
  return exams.filter(exam => exam.createdBy === teacherId);
};

export const getExamsForStudent = async (studentId: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Filter exams assigned to this student
  return exams
    .filter(exam => exam.assignedStudents.includes(studentId))
    .map(exam => {
      // Check if student has a submission for this exam
      const submission = submissions.find(
        sub => sub.examId === exam.id && sub.studentId === studentId
      );
      
      return {
        ...exam,
        status: submission ? "completed" : exam.status,
        score: submission?.score,
        maxScore: submission?.maxScore,
      };
    });
};

export const createExam = async (examData: Omit<Exam, "id">) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Check user role
  const role = await checkUserRole();
  if (role !== "teacher" && role !== "admin") {
    return {
      success: false,
      error: "Only teachers and admins can create exams",
    };
  }
  
  // Create new exam
  const newExam: Exam = {
    ...examData,
    id: `exam${exams.length + 1}`,
  };
  
  // Add to mock database
  exams.push(newExam);
  
  return {
    success: true,
    exam: newExam,
  };
};

export const getExamById = async (examId: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Find exam by ID
  const exam = exams.find(e => e.id === examId);
  
  if (!exam) {
    return {
      success: false,
      error: "Exam not found",
    };
  }
  
  return {
    success: true,
    exam,
  };
};

export const submitExam = async (
  examId: string,
  studentId: string,
  answers: Record<string, string>,
  warningCount: number
) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Find exam by ID
  const exam = exams.find(e => e.id === examId);
  
  if (!exam) {
    return {
      success: false,
      error: "Exam not found",
    };
  }
  
  // Calculate score
  let score = 0;
  let maxScore = 0;
  
  exam.questions.forEach(question => {
    maxScore += question.points;
    
    if (answers[question.id] === question.correctAnswer) {
      score += question.points;
    }
  });
  
  // Create submission
  const submission: ExamSubmission = {
    examId,
    studentId,
    answers,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    score,
    maxScore,
    warningCount,
  };
  
  // Add to mock database
  submissions.push(submission);
  
  return {
    success: true,
    submission,
  };
};

export const getExamSubmissions = async (examId: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Check user role
  const role = await checkUserRole();
  if (role !== "teacher" && role !== "admin") {
    return {
      success: false,
      error: "Only teachers and admins can view submissions",
    };
  }
  
  // Filter submissions for this exam
  const examSubmissions = submissions.filter(sub => sub.examId === examId);
  
  return {
    success: true,
    submissions: examSubmissions,
  };
};

export const getStudentResults = async (studentId: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Filter submissions for this student
  const studentSubmissions = submissions.filter(sub => sub.studentId === studentId);
  
  // Get exam details for each submission
  const results = await Promise.all(
    studentSubmissions.map(async (submission) => {
      const { success, exam, error } = await getExamById(submission.examId);
      
      if (!success || !exam) {
        return null;
      }
      
      return {
        ...submission,
        examTitle: exam.title,
        examSubject: exam.subject,
        examDate: exam.date,
      };
    })
  );
  
  return {
    success: true,
    results: results.filter(Boolean),
  };
};
