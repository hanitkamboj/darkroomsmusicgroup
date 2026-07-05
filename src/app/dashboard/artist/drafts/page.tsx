"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { FileText, Trash2, Send, Edit, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DraftsPage() {
  const { userData } = useAuth();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;
    loadDrafts();
  }, [userData]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "releases"),
        where("userId", "==", userData!.uid),
        where("status", "==", "draft"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      setDrafts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load drafts");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft forever?")) return;
    try {
      await deleteDoc(doc(db, "releases", id));
      toast.success("Draft deleted");
      loadDrafts();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleResubmit = async (release: any) => {
    try {
      await updateDoc(doc(db, "releases", release.id), {
        status: "pending",
        resubmittedAt: new Date().toISOString(),
      });
      toast.success("Release resubmitted for approval!");
      loadDrafts();
    } catch (err) {
      toast.error("Failed to resubmit");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Drafts</h1>
          <p className="text-zinc-400 text-sm mt-1">Incomplete releases and rejected items</p>
        </div>
        <Link href="/dashboard/artist/submit"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm">
          + New Release
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading drafts...</div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400">No drafts</p>
          <p className="text-sm text-zinc-500 mt-1">Draft releases will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft, i) => (
            <motion.div key={draft.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-white/[0.03] border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{draft.albumName || "Untitled Release"}</h3>
                  <p className="text-xs text-zinc-500">{draft.typeOfRelease} • {draft.albumGenre} • {draft.tracks?.length || 0} track(s)</p>
                  {draft.rejectReason && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3" /> {draft.rejectReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleResubmit(draft)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs flex items-center gap-1">
                    <Send className="w-3 h-3" /> {draft.rejectReason ? "Resubmit" : "Submit"}
                  </button>
                  <button onClick={() => handleDelete(draft.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
