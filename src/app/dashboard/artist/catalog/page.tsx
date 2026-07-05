"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Music, Search, Trash2, Eye, Disc3, Calendar, Clock } from "lucide-react";

export default function CatalogPage() {
  const { userData } = useAuth();
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRelease, setSelectedRelease] = useState<any>(null);

  useEffect(() => {
    if (!userData) return;
    loadCatalog();
  }, [userData]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "releases"),
        where("userId", "==", userData!.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      setReleases(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load catalog");
    }
    setLoading(false);
  };

  const handleDelete = async (releaseId: string) => {
    if (!confirm("Are you sure you want to delete this release?")) return;
    try {
      await deleteDoc(doc(db, "releases", releaseId));
      toast.success("Release deleted");
      loadCatalog();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filteredReleases = releases.filter((r) =>
    r.albumName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    draft: "text-zinc-400 bg-zinc-500/10",
    pending: "text-amber-400 bg-amber-500/10",
    approved: "text-green-400 bg-green-500/10",
    rejected: "text-red-400 bg-red-500/10",
    submitted: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Catalog</h1>
          <p className="text-zinc-400 text-sm mt-1">All your releases in one place</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9 pr-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="Search catalog..." />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading catalog...</div>
        ) : filteredReleases.length === 0 ? (
          <div className="text-center py-16 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <Disc3 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">Your catalog is empty</p>
            <p className="text-sm text-zinc-500 mt-1">Submit your first release to get started</p>
          </div>
        ) : (
          filteredReleases.map((release, i) => (
            <motion.div key={release.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/20 transition-all cursor-pointer"
              onClick={() => setSelectedRelease(selectedRelease?.id === release.id ? null : release)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  {release.coverArtUrl ? (
                    <img src={release.coverArtUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Music className="w-7 h-7 text-purple-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-medium">{release.albumName} {release.albumVersion && `(${release.albumVersion})`}</h3>
                    <p className="text-xs text-zinc-500">{release.typeOfRelease} • {release.albumGenre} • {release.albumLanguage}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">ID: {release.releaseId || release.id?.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${statusColors[release.status] || ""}`}>
                    {release.status}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(release.id); }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {selectedRelease?.id === release.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-zinc-800"
                >
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-zinc-500">Label:</span> {release.labelName}</div>
                    <div><span className="text-zinc-500">Copyright:</span> {release.cLine}</div>
                    <div><span className="text-zinc-500">Release Date:</span> {release.trackReleaseDate}</div>
                    <div><span className="text-zinc-500">Tracks:</span> {release.tracks?.length || 0}</div>
                    <div><span className="text-zinc-500">Content Type:</span> {release.contentType}</div>
                    <div><span className="text-zinc-500">Submitted:</span> {release.createdAt?.toDate?.()?.toLocaleDateString() || ""}</div>
                    {release.rejectReason && (
                      <div className="md:col-span-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <span className="text-red-400 font-medium">Reason for rejection:</span>
                        <p className="text-red-300 text-sm mt-1">{release.rejectReason}</p>
                      </div>
                    )}
                  </div>
                  {release.tracks?.map((track: any, idx: number) => (
                    <div key={idx} className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-sm">
                      <p className="font-medium">Track {idx + 1}: {track.trackName}</p>
                      <div className="flex flex-wrap gap-4 mt-1 text-xs text-zinc-500">
                        <span>Genre: {track.trackGenre}/{track.trackSubgenre}</span>
                        <span>Language: {track.trackLanguage}</span>
                        {track.explicitLyrics === "Yes" && <span className="text-red-400">Explicit</span>}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
