
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
