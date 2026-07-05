import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCXc3kpc2c0vBRUMim2IswEbN9LMLqc4v0",
  authDomain: "darkrooms-music-group-9c6ad.firebaseapp.com",
  projectId: "darkrooms-music-group-9c6ad",
  storageBucket: "darkrooms-music-group-9c6ad.firebasestorage.app",
  messagingSenderId: "492791644825",
  appId: "1:492791644825:web:11e5c6af9584e7382eae08",
  measurementId: "G-E35KPJL4B1",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
