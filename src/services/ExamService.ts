import { ref, set, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../config/firebase';
import { checkUserRole } from './AuthService';

interface ExamSection {
  id: string;
  name: string;
  timeLimit: number;
  questions: Question[];
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  semester?: string;
  createdBy: string;
  date: string;
  time: string;
  duration: number;
  status: "draft" | "scheduled" | "active" | "completed";
  questions?: Question[];
  sections?: ExamSection[];
  instructions?: string[];
  assignedStudents: string[];
  submissions?: Record<string, Submission>;
}

interface Submission {
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  startTime: string;
  endTime: string;
  score: number;
  maxScore: number;
  warningCount: number;
  sectionScores?: {
    sectionId: string;
    score: number;
    maxScore: number;
  }[];
}

interface Question {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  text: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  section?: string;
  timeLimit?: number;
}

export const getExamsForTeacher = async (teacherId: string) => {
  try {
    const examsRef = ref(db, 'exams');
    const snapshot = await get(examsRef);
    
    if (snapshot.exists()) {
      const exams: Exam[] = [];
      snapshot.forEach((childSnapshot) => {
        const exam = childSnapshot.val();
        if (exam.createdBy === teacherId) {
          exams.push({ id: childSnapshot.key || '', ...exam });
        }
      });
      return exams;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching teacher exams:', error);
    return [];
  }
};

export const getExamById = async (examId: string) => {
  try {
    const examRef = ref(db, `exams/${examId}`);
    const snapshot = await get(examRef);
    
    if (snapshot.exists()) {
      const examData = snapshot.val();
      return {
        success: true,
        exam: { 
          id: examId,
          ...examData,
          sections: examData.sections.map((section: any, index: number) => ({
            ...section,
            id: `section-${index + 1}`,
            questions: examData.questions.filter((q: any) => q.section === section.name)
          }))
        },
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
    
    let score = 0;
    let maxScore = 0;
    
    exam.questions.forEach(question => {
      maxScore += question.points;
      if (answers[question.id] === question.correctAnswer) {
        score += question.points;
      }
    });
    
    const submission = {
      examId,
      studentId,
      answers,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      score,
      maxScore,
      warningCount,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    };
    
    // Update exam submission in Firebase
    await set(ref(db, `exams/${examId}/submissions/${studentId}`), submission);
    
    // Update student's exam status to completed
    await set(ref(db, `students/${studentId}/exams/${examId}/status`), "completed");
    
    return {
      success: true,
      submission,
    };
  } catch (error) {
    console.error("Error submitting exam:", error);
    return {
      success: false,
      error: "Failed to submit exam",
    };
  }
};

export const getExamsForStudent = async (studentId: string) => {
  try {
    const examsRef = ref(db, 'exams');
    const snapshot = await get(examsRef);
    
    if (snapshot.exists()) {
      const exams: Exam[] = [];
      const currentDate = new Date();
      
      snapshot.forEach((childSnapshot) => {
        const exam = childSnapshot.val();
        if (exam.assignedStudents && exam.assignedStudents.includes(studentId)) {
          const submission = exam.submissions?.[studentId];
          
          // Parse exam date and time into a Date object
          const [year, month, day] = exam.date.split('-').map(Number);
          const [hours, minutes] = exam.time.split(':').map(Number);
          const examStartTime = new Date(year, month - 1, day, hours, minutes);
          
          // Calculate exam end time
          const examEndTime = new Date(examStartTime);
          examEndTime.setMinutes(examEndTime.getMinutes() + exam.duration);
          
          // Determine the current status based on time
          let currentStatus = exam.status;
          if (currentStatus === "scheduled") {
            if (currentDate >= examStartTime && currentDate < examEndTime) {
              currentStatus = "active";
              // Update the exam status in the database
              updateExamStatus(childSnapshot.key || '', "active");
            }
          }
          
          exams.push({
            ...exam,
            id: childSnapshot.key || '',
            status: submission ? "completed" : currentStatus,
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

// Helper function to update exam status
const updateExamStatus = async (examId: string, status: "draft" | "scheduled" | "active" | "completed") => {
  try {
    const examRef = ref(db, `exams/${examId}/status`);
    await set(examRef, status);
  } catch (error) {
    console.error('Error updating exam status:', error);
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
    
    // Create a new exam reference in the database
    const examRef = ref(db, 'exams');
    const newExamRef = push(examRef);
    const examId = newExamRef.key;
    
    if (!examId) {
      return {
        success: false,
        error: "Failed to generate exam ID",
      };
    }
    
    // Save the exam data
    await set(newExamRef, examData);
    
    return {
      success: true,
      exam: { id: examId, ...examData },
    };
  } catch (error) {
    console.error('Error creating exam:', error);
    return {
      success: false,
      error: "Failed to create exam",
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
      const submissions: any[] = [];
      snapshot.forEach((childSnapshot) => {
        submissions.push({
          studentId: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      return {
        success: true,
        submissions,
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
      .map(exam => {
        const submissionData = exam.submissions?.[studentId] || {};
        return {
          examId: exam.id,
          examTitle: exam.title,
          examSubject: exam.subject,
          examDate: exam.date,
          ...submissionData
        };
      });
    
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

export const getTopStudentsBySubject = async (subject: string) => {
  try {
    const examsRef = ref(db, 'exams');
    let snapshot;
    
    if (subject === "All") {
      snapshot = await get(examsRef);
    } else {
      const subjectQuery = query(examsRef, orderByChild('subject'), equalTo(subject));
      snapshot = await get(subjectQuery);
    }
    
    if (!snapshot.exists()) {
      return {
        success: true,
        topStudents: []
      };
    }
    
    // Collect all student submissions across exams
    const studentScores: Record<string, { totalScore: number, totalMaxScore: number, examCount: number, name: string }> = {};
    
    snapshot.forEach((examSnapshot) => {
      const exam = examSnapshot.val();
      const submissions = exam.submissions || {};
      
      Object.entries(submissions).forEach(([studentId, submission]: [string, any]) => {
        if (!studentScores[studentId]) {
          studentScores[studentId] = {
            totalScore: 0,
            totalMaxScore: 0,
            examCount: 0,
            name: submission.studentName || `Student ${studentId.slice(-4)}`
          };
        }
        
        studentScores[studentId].totalScore += submission.score || 0;
        studentScores[studentId].totalMaxScore += submission.maxScore || 0;
        studentScores[studentId].examCount += 1;
      });
    });
    
    // Calculate average scores and sort
    const topStudents = Object.entries(studentScores)
      .map(([studentId, data]) => ({
        id: studentId,
        name: data.name,
        averageScore: data.totalMaxScore > 0 
          ? Math.round((data.totalScore / data.totalMaxScore) * 100) 
          : 0,
        examCount: data.examCount
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3);
    
    return {
      success: true,
      topStudents
    };
    
  } catch (error) {
    console.error('Error fetching top students:', error);
    return {
      success: false,
      error: "Failed to fetch top students",
      topStudents: []
    };
  }
};

export const getTopStudents = async (examId: string) => {
  try {
    const submissionsResult = await getExamSubmissions(examId);
    
    if (submissionsResult.success) {
      const sortedSubmissions = submissionsResult.submissions
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3)
        .map(submission => ({
          name: submission.studentName || `Student ${submission.studentId.slice(-4)}`,
          score: submission.percentage
        }));
      
      return {
        success: true,
        topStudents: sortedSubmissions
      };
    }
    
    return {
      success: false,
      error: "No submissions found",
      topStudents: []
    };
  } catch (error) {
    console.error('Error fetching top students:', error);
    return {
      success: false,
      error: "Failed to fetch top students",
      topStudents: []
    };
  }
};
