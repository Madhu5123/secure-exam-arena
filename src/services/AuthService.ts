
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '../config/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  profileImage?: string; // Added profileImage property as optional
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
  // First check if we have the admin user in localStorage
  const storedUser = localStorage.getItem("examUser");
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser && parsedUser.id && parsedUser.role) {
        currentUser = parsedUser as User;
        return currentUser;
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
  }

  // If not admin user in localStorage, check Firebase auth
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
            profileImage: userData.profileImage || '', // Added profileImage with fallback empty string
          };
          
          // Store the user in localStorage for future use
          localStorage.setItem("examUser", JSON.stringify(currentUser));
          
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
  // First check if we have a user in localStorage
  const storedUser = localStorage.getItem("examUser");
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser && parsedUser.role) {
        return parsedUser.role as "admin" | "teacher" | "student";
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
  }
  
  // If not in localStorage, get from Firebase
  const user = await getCurrentUser();
  return user ? user.role : null;
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to send reset email",
    };
  }
};

export const updateUserProfile = async (userData: {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}) => {
  try {
    const userRef = ref(db, `users/${userData.id}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const existingData = snapshot.val();
      
      // Update with new data while preserving existing data
      await set(userRef, {
        ...existingData,
        name: userData.name,
        email: userData.email,
        profileImage: userData.profileImage || existingData.profileImage || '',
        updatedAt: new Date().toISOString(),
      });
    } else {
      // If user data doesn't exist yet, create it
      await set(userRef, {
        name: userData.name,
        email: userData.email,
        role: "student", // Default role
        profileImage: userData.profileImage || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Update currentUser and localStorage
    if (currentUser && currentUser.id === userData.id) {
      currentUser = {
        ...currentUser,
        name: userData.name,
        email: userData.email,
        profileImage: userData.profileImage || currentUser.profileImage || '',
      };
      
      localStorage.setItem("examUser", JSON.stringify(currentUser));
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
};
