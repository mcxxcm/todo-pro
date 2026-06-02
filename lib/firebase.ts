import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore
import { getAuth, initializeAuth, Auth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  projectId: "todo-pro-3eab1",
  appId: "1:522771236124:web:eeeeeb45db7309cf9126d9",
  storageBucket: "todo-pro-3eab1.firebasestorage.app",
  apiKey: "AIzaSyBeO0ZsHkFRs6Vs_yoXHyqNk4Gp98XhggA",
  authDomain: "todo-pro-3eab1.firebaseapp.com",
  messagingSenderId: "522771236124",
  measurementId: "G-GSVCPH8EFQ",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence using AsyncStorage for React Native, or default for Web
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fallback if already initialized
    auth = getAuth(app);
  }
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
