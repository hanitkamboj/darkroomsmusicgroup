"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Music, Search, Eye, Send, CheckCircle, XCircle, Loader2, Filter,
} from "lucide-react";

export default function AdminReleasesPage() {
  const { userData } = useAuth();
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedRelease, setSelectedRelease] = useState<any>(null);

  useEffect(() => {
    loadAllReleases();
  }, []);

  const loadAllReleases = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "releases"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setReleases(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load releases");
    }
    setLoading(false);
  };

  const handleSubmitToApi = async (release: any) => {
    try {
      const payload = {
        pin: "89657958",
        client_id: "20260522_darkroomsmusicgroup@gmail.com",
        albumname: release.albumName,
        albumVersion: release.albumVersion || "",
        typeOfRelease: release.typeOfRelease,
        albumGenre: release.albumGenre,
        albumSubgenre: release.albumSubgenre,
        albumLanguage: release.albumLanguage,
        contentType: release.contentType,
        trackReleaseDate: release.trackReleaseDate,
        labelName: release.labelName,
        cLine: release.cLine,
        pLine: release.pLine,
        cover_art_url: release.coverArtUrl,
        artists: (release.artists || []).map((a: any) => ({ name: a.name })),
        tracks: (release.tracks || []).map((t: any) => ({
          trackName: t.trackName,
          audio_url: t.audioUrl,
          trackGenre: t.trackGenre,
          trackSubgenre: t.trackSubgenre,
          trackLanguage: t.trackLanguage,
          explicitLyrics: t.explicitLyrics || "No",
          songwriters: (t.songwriters || []).map((sw: any) => ({ name: sw.name })),
          composers: (t.composers || []).map((c: any) => ({ name: c.name })),
          producers: t.producers || [],
        })),
      };
      const response = await fetch("https://dashboard.direnotemedia.com/ingest_api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      await updateDoc(doc(db, "releases", release.id), {
        status: "submitted",
        submittedToApi: true,
        apiResponse: result,
        submittedAt: new Date().toISOString(),
        submittedByAdmin: userData?.uid,
      });
      toast.success("Release submitted to DNM API!");
      loadAllReleases();
    } catch (err: any) {
      toast.error(err.message || "API submission failed");
    }
  };

  const filtered = releases.filter((r) => {
    const mf = filter === "all" || r.status === filter;
    const ms = r.albumName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.submittedByName?.toLowerCase().includes(searchQuery.toLowerCase());
    return mf && ms;
  });

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
          <h1 className="text-2xl font-bold">All Releases</h1>
          <p className="text-zinc-400 text-sm mt-1">All releases across the platform</p>
        </div>
        <button onClick={loadAllReleases} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Refresh</button>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected", "submitted", "draft"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                filter === f ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}>{f}</button>
          ))}
        </div>
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="Search..." />
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">No releases found</div>
        ) : (
          filtered.map((release, i) => (
            <motion.div key={release.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {release.coverArtUrl ? (
                    <img src={release.coverArtUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Music className="w-5 h-5 text-purple-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium truncate">{release.albumName}</h3>
                    <p className="text-xs text-zinc-500 truncate">{release.submittedByName} • {release.typeOfRelease}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColors[release.status]}`}>{release.status}</span>
                  {release.status === "approved" && (
                    <button onClick={() => handleSubmitToApi(release)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs flex items-center gap-1">
                      <Send className="w-3 h-3" /> Submit
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
