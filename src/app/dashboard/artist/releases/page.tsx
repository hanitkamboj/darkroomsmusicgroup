"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Music, Disc3, CheckCircle, Clock, AlertCircle, Send, ExternalLink } from "lucide-react";

export default function ReleasesPage() {
  const { userData } = useAuth();
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!userData) return;
    loadReleases();
  }, [userData]);

  const loadReleases = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "releases"),
        where("userId", "==", userData!.uid),
        where("status", "in", ["approved", "submitted", "pending", "rejected"]),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      setReleases(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      // Fallback
      const q = query(collection(db, "releases"), where("userId", "==", userData!.uid), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setReleases(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    setLoading(false);
  };

  const filtered = filter === "all" ? releases : releases.filter((r) => r.status === filter);

  const statusConfig: Record<string, { icon: any; color: string }> = {
    pending: { icon: Clock, color: "text-amber-400" },
    approved: { icon: CheckCircle, color: "text-green-400" },
    rejected: { icon: AlertCircle, color: "text-red-400" },
    submitted: { icon: Send, color: "text-blue-400" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Releases</h1>
        <p className="text-zinc-400 text-sm mt-1">Track your release status</p>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "approved", "submitted", "rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm capitalize ${
              filter === f ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Disc3 className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p>No releases found</p>
          </div>
        ) : (
          filtered.map((release, i) => {
            const config = statusConfig[release.status] || { icon: Clock, color: "text-zinc-400" };
            const Icon = config.icon;
            return (
              <motion.div key={release.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {release.coverArtUrl ? (
                      <img src={release.coverArtUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Music className="w-6 h-6 text-purple-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{release.albumName}</h3>
                      <p className="text-xs text-zinc-500">{release.typeOfRelease} • {release.albumGenre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <span className={`text-sm capitalize ${config.color}`}>{release.status}</span>
                    {release.submittedToApi && (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Submitted
                      </span>
                    )}
                  </div>
                </div>
                {release.rejectReason && (
                  <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                    <span className="text-red-400 font-medium">Reason:</span> {release.rejectReason}
                    <p className="text-xs text-red-300 mt-1">Fix the issue and resubmit from Drafts</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
