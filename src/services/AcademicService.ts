
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';

interface AcademicData {
  semesters: string[];
  subjects: string[];
  subjectsBySemester: Record<string, string[]>;
}

export const fetchAcademicData = async (departmentId: string): Promise<AcademicData> => {
  try {
    const departmentRef = ref(db, `departments/${departmentId}`);
    const snapshot = await get(departmentRef);
    
    if (snapshot.exists()) {
      const department = snapshot.val();
      let allSemesters = new Set<string>();
      let allSubjects = new Set<string>();
      const subjectsBySemester: Record<string, string[]> = {};

      // Add semesters
      if (Array.isArray(department.semesters)) {
        department.semesters.forEach((semester: string) => {
          allSemesters.add(semester);
          if (!subjectsBySemester[semester]) {
            subjectsBySemester[semester] = [];
          }
        });
      }

      // Add subjects from each semester
      if (department.subjects) {
        Object.entries(department.subjects).forEach(([semester, semesterSubjects]: [string, any]) => {
          if (Array.isArray(semesterSubjects)) {
            if (!subjectsBySemester[semester]) {
              subjectsBySemester[semester] = [];
            }
            
            semesterSubjects.forEach((subject: any) => {
              if (subject.name) {
                allSubjects.add(subject.name);
                if (!subjectsBySemester[semester].includes(subject.name)) {
                  subjectsBySemester[semester].push(subject.name);
                }
              }
            });
          }
        });
      }

      return {
        semesters: Array.from(allSemesters),
        subjects: Array.from(allSubjects),
        subjectsBySemester
      };
    }
    
    return {
      semesters: [],
      subjects: [],
      subjectsBySemester: {}
    };
  } catch (error) {
    console.error('Error fetching academic data:', error);
    return {
      semesters: [],
      subjects: [],
      subjectsBySemester: {}
    };
  }
};

export const fetchDepartmentSubjects = async (departmentId: string, semester: string): Promise<string[]> => {
  try {
    const departmentRef = ref(db, `departments/${departmentId}/subjects/${semester}`);
    const snapshot = await get(departmentRef);
    
    if (snapshot.exists()) {
      const subjects = snapshot.val();
      if (Array.isArray(subjects)) {
        return subjects.map(subject => subject.name).filter(Boolean);
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching department subjects:', error);
    return [];
  }
};
