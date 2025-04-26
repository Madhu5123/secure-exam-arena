import { ref, set, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../config/firebase';
import { checkUserRole } from './AuthService';

interface ExamSection {
  id: string;
  name: string;
  timeLimit: number;
  questions: Question[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  semester?: string;
  createdBy: string;
  date?: string;
  time?: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: "draft" | "scheduled" | "active" | "completed" | "expired";
  questions?: Question[];
  sections?: ExamSection[];
  instructions?: string[];
  assignedStudents: string[];
  submissions?: Record<string, Submission>;
  department?: string;
}

interface Submission {
  examId: string;
  studentId: string;
  studentName?: string;
  studentPhoto?: string;
  answers: Record<string, string>;
  startTime: string;
  endTime: string;
  score: number;
  maxScore: number;
  warningCount: number;
  percentage?: number;
  timeTaken: string;
  warnings?: Warning[];
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

export const captureWarning = async (
  examId: string,
  studentId: string,
  type: Warning["type"],
  imageBlob: Blob
) => {
  try {
    const studentRef = ref(db, `users/${studentId}`);
    const studentSnapshot = await get(studentRef);
    const studentData = studentSnapshot.exists() ? studentSnapshot.val() : null;
    const studentName = studentData?.name || `Student ${studentId.slice(-4)}`;

    const formData = new FormData();
    formData.append('file', imageBlob);
    formData.append('upload_preset', 'examwarnings');
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/dyp2q6oy1/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload warning image');
    }
    
    const imageData = await response.json();
    
    const warningRef = ref(db, `exams/${examId}/warnings/${Date.now()}`);
    const warning: Warning = {
      id: warningRef.key || '',
      examId,
      studentId,
      studentName,
      timestamp: new Date().toISOString(),
      type,
      imageUrl: imageData.secure_url,
      description: getWarningDescription(type)
    };
    
    await set(warningRef, warning);
    return { success: true, warning };
  } catch (error) {
    console.error('Error capturing warning:', error);
    return { success: false, error: 'Failed to capture warning' };
  }
};

const getWarningDescription = (type: Warning["type"]): string => {
  switch (type) {
    case "no_face":
      return "No face detected in camera feed";
    case "multiple_faces":
      return "Multiple faces detected in camera feed";
    case "unclear_face":
      return "Face is not clearly visible";
    case "fullscreen_exit":
      return "Attempted to exit fullscreen mode";
    default:
      return "Unknown warning type";
  }
};

export const getExamWarnings = async (examId: string) => {
  try {
    const warningsRef = ref(db, `exams/${examId}/warnings`);
    const snapshot = await get(warningsRef);
    
    if (snapshot.exists()) {
      const warnings: Warning[] = [];
      snapshot.forEach((childSnapshot) => {
        warnings.push({
          id: childSnapshot.key || '',
          ...childSnapshot.val()
        });
      });
      return {
        success: true,
        warnings: warnings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      };
    }
    
    return {
      success: true,
      warnings: []
    };
  } catch (error) {
    console.error('Error fetching warnings:', error);
    return {
      success: false,
      error: "Failed to fetch warnings"
    };
  }
};

export const submitExam = async (
  examId: string,
  studentId: string,
  answers: Record<string, string>,
  warningCount: number,
  startTime: string
) => {
  try {
    const { success, exam } = await getExamById(examId);
    
    if (!success || !exam) {
      return {
        success: false,
        error: "Exam not found",
      };
    }
    
    const studentRef = ref(db, `users/${studentId}`);
    const studentSnapshot = await get(studentRef);
    const studentData = studentSnapshot.exists() ? studentSnapshot.val() : null;
    const studentName = studentData?.name || `Student ${studentId.slice(-4)}`;
    const studentPhoto = studentData?.photo || "";
    
    let score = 0;
    let maxScore = 0;
    
    exam.questions.forEach(question => {
      maxScore += question.points;
      if (answers[question.id] === question.correctAnswer) {
        score += question.points;
      }
    });

    const endTime = new Date().toISOString();
    const timeTakenMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const hours = Math.floor(timeTakenMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeTakenMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeTakenMs % (1000 * 60)) / 1000);
    const timeTaken = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const submission = {
      examId,
      studentId,
      studentName,
      studentPhoto,
      answers,
      startTime,
      endTime,
      timeTaken,
      score,
      maxScore,
      warningCount,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    };
    
    await set(ref(db, `exams/${examId}/submissions/${studentId}`), submission);
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
          
          const examEndDate = new Date(exam.endDate);
          let currentStatus = exam.status;
          
          if (currentDate > examEndDate) {
            currentStatus = "expired";
            updateExamStatus(childSnapshot.key || '', "expired");
          } else if (currentStatus === "scheduled") {
            const examStartDate = new Date(exam.startDate);
            if (currentDate >= examStartDate && currentDate <= examEndDate) {
              currentStatus = "active";
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

const updateExamStatus = async (examId: string, status: "draft" | "scheduled" | "active" | "completed" | "expired") => {
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
    
    const examRef = ref(db, 'exams');
    const newExamRef = push(examRef);
    const examId = newExamRef.key;
    
    if (!examId) {
      return {
        success: false,
        error: "Failed to generate exam ID",
      };
    }
    
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
      
      const usersRef = ref(db, 'users');
      const usersSnapshot = await get(usersRef);
      const users: Record<string, any> = {};
      
      if (usersSnapshot.exists()) {
        usersSnapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'student') {
            users[childSnapshot.key as string] = {
              name: userData.name || `Student ${(childSnapshot.key as string).slice(-4)}`,
              photo: userData.photo || ""
            };
          }
        });
      }
      
      snapshot.forEach((childSnapshot) => {
        const submissionData = childSnapshot.val();
        const studentId = childSnapshot.key as string;
        
        if (!submissionData.studentName || !submissionData.studentPhoto) {
          submissionData.studentName = users[studentId]?.name || `Student ${studentId.slice(-4)}`;
          submissionData.studentPhoto = users[studentId]?.photo || "";
          
          set(ref(db, `exams/${examId}/submissions/${studentId}/studentName`), submissionData.studentName);
          set(ref(db, `exams/${examId}/submissions/${studentId}/studentPhoto`), submissionData.studentPhoto);
        }
        
        submissions.push({
          studentId,
          ...submissionData
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
          _questions: exam.questions,
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
    const studentsRef = ref(db, 'users');
    let examSnapshot, studentSnapshot;
    
    studentSnapshot = await get(studentsRef);
    const students: Record<string, any> = {};
    
    if (studentSnapshot.exists()) {
      studentSnapshot.forEach((childSnapshot) => {
        const student = childSnapshot.val();
        if (student.role === 'student') {
          students[childSnapshot.key as string] = {
            id: childSnapshot.key,
            name: student.name || "Unknown Student",
            email: student.email,
            photo: student.photo || "",
            semester: student.semester
          };
        }
      });
    }
    
    if (subject === "All") {
      examSnapshot = await get(examsRef);
    } else {
      const subjectQuery = query(examsRef, orderByChild('subject'), equalTo(subject));
      examSnapshot = await get(subjectQuery);
    }
    
    if (!examSnapshot.exists()) {
      return {
        success: true,
        topStudents: []
      };
    }
    
    const studentScores: Record<string, { 
      totalScore: number, 
      totalMaxScore: number, 
      examCount: number, 
      name: string,
      photo: string
    }> = {};
    
    examSnapshot.forEach((examSnapshot) => {
      const exam = examSnapshot.val();
      const submissions = exam.submissions || {};
      
      Object.entries(submissions).forEach(([studentId, submission]: [string, any]) => {
        if (!studentScores[studentId]) {
          const studentData = students[studentId] || {};
          studentScores[studentId] = {
            totalScore: 0,
            totalMaxScore: 0,
            examCount: 0,
            name: studentData.name || `Unknown Student`,
            photo: studentData.photo || ""
          };
        }
        
        studentScores[studentId].totalScore += submission.score || 0;
        studentScores[studentId].totalMaxScore += submission.maxScore || 0;
        studentScores[studentId].examCount += 1;
      });
    });
    
    const topStudents = Object.entries(studentScores)
      .map(([studentId, data]) => ({
        id: studentId,
        name: data.name,
        photo: data.photo,
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
          photo: submission.studentPhoto || "",
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
