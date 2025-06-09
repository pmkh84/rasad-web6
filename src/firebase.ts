// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZ_-IZPnz2Q09EjdeyzZyEgBnaHyXtnXs",
  authDomain: "excel-storage1.firebaseapp.com",
  projectId: "excel-storage1",
  storageBucket: "excel-storage1.firebasestorage.app",
  messagingSenderId: "955328336962",
  appId: "1:955328336962:web:a0875eaed7e9e7f63d09db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
