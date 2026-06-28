import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These values identify which Firebase project to talk to. They're safe
// to ship in client-side code - Firestore's security rules (not these
// keys) are what actually protect your data.
const firebaseConfig = {
  apiKey: "AIzaSyAE4a4TtqgCPilKqDttPEdk8u490B5pEKI",
  authDomain: "book-library-a4c9e.firebaseapp.com",
  projectId: "book-library-a4c9e",
  storageBucket: "book-library-a4c9e.firebasestorage.app",
  messagingSenderId: "496005476888",
  appId: "1:496005476888:web:f012ab3a2acbce9068896d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
