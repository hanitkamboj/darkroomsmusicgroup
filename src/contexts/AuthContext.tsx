"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: "artist" | "admin" | "label" | "support";
  photoURL?: string;
  createdAt?: string;
  username?: string;
  artistName?: string;
  labelName?: string;
  plan?: "free" | "pro" | "enterprise";
  permissions?: {
    customLabel: boolean;
    customCopyright: boolean;
    customPhonographic: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data() as UserData);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserData(cred.user.uid);
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    const existingUsers = await getDocs(query(collection(db, "users"), limit(1)));
    const isFirstUser = existingUsers.empty;

    const userDataObj: UserData = {
      uid: cred.user.uid,
      email,
      displayName: name,
      role: isFirstUser ? "admin" : (role as UserData["role"]),
      username: name.toLowerCase().replace(/\s+/g, "_"),
      createdAt: new Date().toISOString(),
      plan: "free",
      permissions: {
        customLabel: true,
        customCopyright: true,
        customPhonographic: true,
      },
    };
    await setDoc(doc(db, "users", cred.user.uid), userDataObj);
    await fetchUserData(cred.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  const refreshUserData = async () => {
    if (user) await fetchUserData(user.uid);
  };

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, login, signup, logout, refreshUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
