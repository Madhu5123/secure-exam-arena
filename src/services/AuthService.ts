
// This is a mock auth service that simulates Firebase Authentication
// In a real implementation, this would use Firebase Auth

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
}

let currentUser: User | null = null;

// Mock users database
const users = [
  {
    id: "admin1",
    name: "Admin User",
    email: "admin@gmail.com",
    password: "admin",
    role: "admin" as const,
  },
  {
    id: "teacher1",
    name: "John Smith",
    email: "john.smith@example.com",
    password: "password123",
    role: "teacher" as const,
  },
  {
    id: "teacher2",
    name: "Sarah Jones",
    email: "sarah.jones@example.com",
    password: "password123",
    role: "teacher" as const,
  },
  {
    id: "student1",
    name: "Alex Johnson",
    email: "alex.j@example.com",
    password: "password123",
    role: "student" as const,
  },
  {
    id: "student2",
    name: "Emily Chen",
    email: "emily.c@example.com",
    password: "password123",
    role: "student" as const,
  },
];

export const loginUser = async (email: string, password: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find user with matching email and password
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    // Store user info in localStorage (simulating auth state persistence)
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem("examUser", JSON.stringify(userWithoutPassword));
    currentUser = userWithoutPassword;
    
    return {
      success: true,
      role: user.role,
    };
  }

  return {
    success: false,
    error: "Invalid email or password",
  };
};

export const logoutUser = async () => {
  // Clear user from localStorage
  localStorage.removeItem("examUser");
  currentUser = null;
  
  return { success: true };
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (currentUser) return currentUser;
  
  // Check if user is stored in localStorage
  const storedUser = localStorage.getItem("examUser");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    return currentUser;
  }
  
  return null;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: "teacher" | "student"
) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check if email is already in use
  if (users.some(u => u.email === email)) {
    return {
      success: false,
      error: "Email is already in use",
    };
  }

  // In a real app, this would create a new user in Firebase Auth
  const newUser = {
    id: `${role}${users.length + 1}`,
    name,
    email,
    password,
    role,
  };

  // Add to mock database
  users.push(newUser);

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  };
};

export const checkUserRole = async (): Promise<"admin" | "teacher" | "student" | null> => {
  const user = await getCurrentUser();
  return user ? user.role : null;
};
