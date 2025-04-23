
import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

interface AcademicData {
  semesters: string[];
  subjects: string[];
}

export const fetchAcademicData = async (): Promise<AcademicData> => {
  try {
    const academicRef = ref(db, 'academic');
    const snapshot = await get(academicRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    // If no data exists, initialize with default values
    const defaultData: AcademicData = {
      semesters: ["Semester 1", "Semester 2", "Semester 3", "Semester 4"],
      subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "History", "Geography"]
    };
    
    await set(academicRef, defaultData);
    return defaultData;
  } catch (error) {
    console.error('Error fetching academic data:', error);
    return {
      semesters: [],
      subjects: []
    };
  }
};
