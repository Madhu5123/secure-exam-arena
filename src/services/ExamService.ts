
import { ref, set, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../config/firebase';
import { checkUserRole } from './AuthService';

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

export const getExamsForTeacher = async (teacherId: string) => {
  try {
    const examsRef = ref(db, 'exams');
    const teacherExamsQuery = query(examsRef, orderByChild('createdBy'), equalTo(teacherId));
    const snapshot = await get(teacherExamsQuery);
    
    if (snapshot.exists()) {
      const exams: Exam[] = [];
      snapshot.forEach((childSnapshot) => {
        exams.push({ id: childSnapshot.key || '', ...childSnapshot.val() });
      });
      return exams;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching teacher exams:', error);
    return [];
  }
};

export const getExamsForStudent = async (studentId: string) => {
  try {
    const examsRef = ref(db, 'exams');
    const snapshot = await get(examsRef);
    
    if (snapshot.exists()) {
      const exams: any[] = [];
      snapshot.forEach((childSnapshot) => {
        const exam = childSnapshot.val();
        if (exam.assignedStudents && exam.assignedStudents.includes(studentId)) {
          // Check if student has submitted this exam
          const submission = exam.submissions?.[studentId];
          exams.push({
            ...exam,
            id: childSnapshot.key || '',
            status: submission ? "completed" : exam.status,
            score: submission?.score,
            maxScore: submission?.maxScore,
          });
        }
      });
      return exams;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching student exams:', error);
    return [];
  }
};

export const createExam = async (examData: Omit<Exam, "id">) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin") {
      return {
        success: false,
        error: "Only teachers and admins can create exams",
      };
    }
    
    const examRef = ref(db, 'exams');
    const newExamRef = push(examRef);
    await set(newExamRef, examData);
    
    return {
      success: true,
      exam: { id: newExamRef.key, ...examData },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create exam",
    };
  }
};

export const getExamById = async (examId: string) => {
  try {
    const examRef = ref(db, `exams/${examId}`);
    const snapshot = await get(examRef);
    
    if (snapshot.exists()) {
      return {
        success: true,
        exam: { id: examId, ...snapshot.val() },
      };
    }
    
    return {
      success: false,
      error: "Exam not found",
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch exam",
    };
  }
};

export const submitExam = async (
  examId: string,
  studentId: string,
  answers: Record<string, string>,
  warningCount: number
) => {
  try {
    const { success, exam } = await getExamById(examId);
    
    if (!success || !exam) {
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
    
    await set(ref(db, `exams/${examId}/submissions/${studentId}`), submission);
    
    return {
      success: true,
      submission,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to submit exam",
    };
  }
};

export const getExamSubmissions = async (examId: string) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin") {
      return {
        success: false,
        error: "Only teachers and admins can view submissions",
      };
    }
    
    const submissionsRef = ref(db, `exams/${examId}/submissions`);
    const snapshot = await get(submissionsRef);
    
    if (snapshot.exists()) {
      return {
        success: true,
        submissions: Object.entries(snapshot.val()).map(([studentId, submission]) => ({
          studentId,
          ...submission,
        })),
      };
    }
    
    return {
      success: true,
      submissions: [],
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch submissions",
    };
  }
};

export const getStudentResults = async (studentId: string) => {
  try {
    const exams = await getExamsForStudent(studentId);
    const results = exams
      .filter(exam => exam.status === "completed")
      .map(exam => ({
        ...exam.submissions?.[studentId],
        examTitle: exam.title,
        examSubject: exam.subject,
        examDate: exam.date,
      }));
    
    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch results",
    };
  }
};
