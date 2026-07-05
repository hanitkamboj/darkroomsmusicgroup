"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Users, Plus, X, User, Music, Pen, Mic, Disc } from "lucide-react";

export default function CreditsPage() {
  const { userData } = useAuth();
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("artist");
  const [newIpi, setNewIpi] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newSpotify, setNewSpotify] = useState("");
  const [newApple, setNewApple] = useState("");

  useEffect(() => {
    if (!userData) return;
    loadCredits();
  }, [userData]);

  const loadCredits = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "credits"), where("userId", "==", userData!.uid));
      const snapshot = await getDocs(q);
      setCredits(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load credits");
    }
    setLoading(false);
  };

  const addCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await addDoc(collection(db, "credits"), {
        userId: userData?.uid,
        name: newName.trim(),
        role: newRole,
        ipi: newIpi,
        instagramUrl: newInstagram,
        spotifyUrl: newSpotify,
        appleUrl: newApple,
        createdAt: new Date().toISOString(),
      });
      toast.success(`${newRole}: ${newName} saved!`);
      setNewName("");
      setNewIpi("");
      setNewInstagram("");
      setNewSpotify("");
      setNewApple("");
      loadCredits();
    } catch (err) {
      toast.error("Failed to save credit");
    }
  };

  const deleteCredit = async (id: string) => {
    try {
      await deleteDoc(doc(db, "credits", id));
      toast.success("Removed");
      loadCredits();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const roleIcons: Record<string, any> = {
    artist: Mic,
    songwriter: Pen,
    composer: Music,
    producer: Disc,
    featuring: User,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Credits & Artists</h1>
        <p className="text-zinc-400 text-sm mt-1">Save artists, songwriters, and composers for quick selection</p>
      </div>

      <form onSubmit={addCredit} className="p-6 rounded-xl bg-white/[0.03] border border-purple-500/20 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="w-5 h-5 text-purple-400" /> Add New Credit</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Full Name *</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="Name" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
              <option value="artist">Artist</option>
              <option value="featuring">Featuring Artist</option>
              <option value="songwriter">Songwriter</option>
              <option value="composer">Composer</option>
              <option value="producer">Producer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">IPI #</label>
            <input type="text" value={newIpi} onChange={(e) => setNewIpi(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Instagram</label>
            <input type="text" value={newInstagram} onChange={(e) => setNewInstagram(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="@handle" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Spotify URL</label>
            <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Apple Music URL</label>
            <input type="text" value={newApple} onChange={(e) => setNewApple(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="https://..." />
          </div>
        </div>
        <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm">Save Credit</button>
      </form>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-3">Saved Credits ({credits.length})</h2>
        {loading ? (
          <div className="text-center py-8 text-zinc-500">Loading...</div>
        ) : credits.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <Users className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
            <p className="text-sm">No saved credits yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {credits.map((credit, i) => {
              const Icon = roleIcons[credit.role] || User;
              return (
                <motion.div key={credit.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-purple-500/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-purple-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{credit.name}</p>
                      <p className="text-xs text-zinc-500 capitalize">{credit.role}{credit.ipi ? ` • IPI: ${credit.ipi}` : ""}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteCredit(credit.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
