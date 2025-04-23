
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';

interface AcademicData {
  semesters: string[];
  subjects: string[];
  subjectsBySemester: Record<string, string[]>;
}

export const fetchAcademicData = async (): Promise<AcademicData> => {
  try {
    const departmentsRef = ref(db, 'departments');
    const snapshot = await get(departmentsRef);
    
    if (snapshot.exists()) {
      const departments = snapshot.val();
      let allSemesters = new Set<string>();
      let allSubjects = new Set<string>();
      const subjectsBySemester: Record<string, string[]> = {};

      // Loop through each department
      Object.values(departments).forEach((dept: any) => {
        // Add semesters
        if (Array.isArray(dept.semesters)) {
          dept.semesters.forEach((semester: string) => {
            allSemesters.add(semester);
            
            // Initialize the subjects array for this semester if it doesn't exist
            if (!subjectsBySemester[semester]) {
              subjectsBySemester[semester] = [];
            }
          });
        }

        // Add subjects from each semester
        if (dept.subjects) {
          Object.entries(dept.subjects).forEach(([semester, semesterSubjects]: [string, any]) => {
            if (Array.isArray(semesterSubjects)) {
              // Initialize the semester's subject array if it doesn't exist
              if (!subjectsBySemester[semester]) {
                subjectsBySemester[semester] = [];
              }
              
              semesterSubjects.forEach((subject: any) => {
                if (subject.name) {
                  allSubjects.add(subject.name);
                  // Add to the semester's subjects if not already present
                  if (!subjectsBySemester[semester].includes(subject.name)) {
                    subjectsBySemester[semester].push(subject.name);
                  }
                }
              });
            }
          });
        }
      });

      return {
        semesters: Array.from(allSemesters),
        subjects: Array.from(allSubjects),
        subjectsBySemester
      };
    }
    
    // If no data exists, return empty arrays
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
