
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '../config/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
}

let currentUser: User | null = null;

export const loginUser = async (email: string, password: string) => {
  // Special case for admin login
  if (email === "admin@gmail.com" && password === "admin") {
    const adminUser: User = {
      id: "admin-id",
      name: "Admin User",
      email: "admin@gmail.com",
      role: "admin"
    };
    
    localStorage.setItem("examUser", JSON.stringify(adminUser));
    currentUser = adminUser;
    
    return {
      success: true,
      role: "admin",
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userRef = ref(db, `users/${userCredential.user.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const user: User = {
        id: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };
      
      localStorage.setItem("examUser", JSON.stringify(user));
      currentUser = user;
      
      return {
        success: true,
        role: user.role,
      };
    }
    
    return {
      success: false,
      error: "User data not found",
    };
  } catch (error) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("examUser");
    currentUser = null;
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to logout" };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          currentUser = {
            id: firebaseUser.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
          };
          resolve(currentUser);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: "teacher" | "student"
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store additional user data in Realtime Database
    await set(ref(db, `users/${user.uid}`), {
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      user: {
        id: user.uid,
        name,
        email,
        role,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to register user",
    };
  }
};

export const checkUserRole = async (): Promise<"admin" | "teacher" | "student" | null> => {
  const user = await getCurrentUser();
  return user ? user.role : null;
};
