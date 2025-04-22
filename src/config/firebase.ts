
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration - replace with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyBExvbaYMXH40VgVzI8qV08QnIOzJ0jFtE",
  authDomain: "exam-portal-demo.firebaseapp.com",
  databaseURL: "https://exam-portal-demo-default-rtdb.firebaseio.com",
  projectId: "exam-portal-demo",
  storageBucket: "exam-portal-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
