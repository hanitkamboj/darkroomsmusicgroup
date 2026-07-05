"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Users, Plus, Key, Shield, UserX, UserCog, Search, Mail, Lock, User } from "lucide-react";

export default function AdminUsersPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "artist" as const,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load users");
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      toast.error("All fields are required");
      return;
    }
    try {
      const apiKey = "AIzaSyCXc3kpc2c0vBRUMim2IswEbN9LMLqc4v0";
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          returnSecureToken: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create user");

      const uid = data.localId;
      await setDoc(doc(db, "users", uid), {
        uid,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        username: newUser.displayName.toLowerCase().replace(/\s+/g, "_"),
        createdAt: new Date().toISOString(),
        plan: "free",
        permissions: { customLabel: false, customCopyright: false, customPhonographic: false },
        createdBy: userData?.uid,
      });
      toast.success(`User ${newUser.displayName} created successfully!`);
      setShowCreate(false);
      setNewUser({ email: "", password: "", displayName: "", role: "artist" });
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success("User role updated!");
      loadUsers();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("User deleted!");
      loadUsers();
    } catch (err) {
      toast.error("Failed to delete user. Delete from Firebase Console manually.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage all platform users</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/[0.03] border border-purple-500/30"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><UserCog className="w-5 h-5 text-purple-400" /> Create New User</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input type="text" value={newUser.displayName} onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="user@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Temporary Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="temp123456" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
                  <option value="artist">Artist</option>
                  <option value="admin">Admin</option>
                  <option value="label">Label</option>
                  <option value="support">Support</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm">Create User</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="Search users by name or email..." />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-left">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Plan</th>
              <th className="pb-3 font-medium">Created</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="pt-8 text-center text-zinc-500">Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="pt-8 text-center text-zinc-500">No users found</td></tr>
            ) : (
              filteredUsers.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-zinc-800/50 hover:bg-white/[0.02]"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-300" />
                      </div>
                      <span className="font-medium">{u.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-zinc-400">{u.email}</td>
                  <td className="py-3">
                    {u.uid === userData?.uid ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">{u.role}</span>
                    ) : (
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 bg-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500">
                        <option value="artist">Artist</option>
                        <option value="admin">Admin</option>
                        <option value="label">Label</option>
                        <option value="support">Support</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 text-zinc-400 capitalize">{u.plan || "free"}</td>
                  <td className="py-3 text-zinc-500 text-xs">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleResetPassword(u.email)}
                        className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors" title="Reset Password">
                        <Key className="w-4 h-4" />
                      </button>
                      {u.uid !== userData?.uid && (
                        <button onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="Delete User">
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
