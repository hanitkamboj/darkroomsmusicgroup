"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import toast from "react-hot-toast";
import { User, Mail, Shield, Camera, Save, Lock, BadgeCheck, Music } from "lucide-react";

export default function ProfilePage() {
  const { user, userData, refreshUserData } = useAuth();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(userData?.displayName || "");
  const [artistName, setArtistName] = useState(userData?.artistName || "");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [appleUrl, setAppleUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setArtistName(userData.artistName || "");
    }
  }, [userData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", userData!.uid), {
        displayName,
        artistName,
      });
      await refreshUserData();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to update profile");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user!.email!, currentPassword);
      await reauthenticateWithCredential(user!, credential);
      await updatePassword(user!, newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-purple-600/20 border-2 border-purple-500/30 flex items-center justify-center">
          <User className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{userData?.displayName}</h1>
          <p className="text-zinc-400 text-sm flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> {userData?.email}
          </p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-xs mt-1">
            <Shield className="w-3 h-3" /> {userData?.role?.toUpperCase()} • {userData?.plan} Plan
          </span>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5 text-purple-400" /> Profile Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Artist/Band Name</label>
            <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input type="email" value={userData?.email || ""} disabled
              className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-400 cursor-not-allowed" />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 rounded-lg text-sm flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Lock className="w-5 h-5 text-purple-400" /> Change Password</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
        </div>
        <button type="submit"
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm flex items-center gap-2">
          <Lock className="w-4 h-4" /> Update Password
        </button>
      </form>

      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><BadgeCheck className="w-5 h-5 text-purple-400" /> Account Details</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-zinc-500">User ID:</span> <span className="text-zinc-300">{userData?.uid?.slice(0, 16)}...</span></div>
          <div><span className="text-zinc-500">Username:</span> <span className="text-zinc-300">{userData?.username}</span></div>
          <div><span className="text-zinc-500">Role:</span> <span className="text-zinc-300 capitalize">{userData?.role}</span></div>
          <div><span className="text-zinc-500">Plan:</span> <span className="text-zinc-300 capitalize">{userData?.plan}</span></div>
          <div><span className="text-zinc-500">Member Since:</span> <span className="text-zinc-300">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "—"}</span></div>
        </div>
      </div>
    </div>
  );
}
