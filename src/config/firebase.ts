
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration - replace with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyDCLwjLBJPl6R1Z_drxuueNrYFmpH_RUUg",
  authDomain: "examportal-d4923.firebaseapp.com",
  databaseURL: "https://examportal-d4923-default-rtdb.firebaseio.com",
  projectId: "examportal-d4923",
  storageBucket: "examportal-d4923.firebasestorage.app",
  messagingSenderId: "322929484275",
  appId: "1:322929484275:web:5e6a4a3cdf332bacfcb286",
  measurementId: "G-8KB5642XET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
