import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCrqBsnd5T539L3V7PCC_FeBeAJFMA4y0s",
  authDomain: "sonifall.firebaseapp.com",
  projectId: "sonifall",
  storageBucket: "sonifall.firebasestorage.app",
  messagingSenderId: "822971265775",
  appId: "1:822971265775:web:d406dbb037db4f2512e11a",
  measurementId: "G-WKLJ9CRB2C",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
