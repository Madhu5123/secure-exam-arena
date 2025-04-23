
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';

interface AcademicData {
  semesters: string[];
  subjects: string[];
}

export const fetchAcademicData = async (): Promise<AcademicData> => {
  try {
    const departmentsRef = ref(db, 'departments');
    const snapshot = await get(departmentsRef);
    
    if (snapshot.exists()) {
      const departments = snapshot.val();
      let allSemesters = new Set<string>();
      let allSubjects = new Set<string>();

      // Loop through each department
      Object.values(departments).forEach((dept: any) => {
        // Add semesters
        if (Array.isArray(dept.semesters)) {
          dept.semesters.forEach((semester: string) => allSemesters.add(semester));
        }

        // Add subjects from each semester
        if (dept.subjects) {
          Object.values(dept.subjects).forEach((semesterSubjects: any) => {
            if (Array.isArray(semesterSubjects)) {
              semesterSubjects.forEach((subject: any) => {
                if (subject.name) {
                  allSubjects.add(subject.name);
                }
              });
            }
          });
        }
      });

      return {
        semesters: Array.from(allSemesters),
        subjects: Array.from(allSubjects)
      };
    }
    
    // If no data exists, return empty arrays
    return {
      semesters: [],
      subjects: []
    };
  } catch (error) {
    console.error('Error fetching academic data:', error);
    return {
      semesters: [],
      subjects: []
    };
  }
};
