"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import {
  CheckCircle, XCircle, Eye, Send, Loader2, Search,
  Music, User, Calendar, Clock, AlertTriangle, MessageSquare,
} from "lucide-react";
import { DEFAULT_LABEL, DEFAULT_CLINE, DEFAULT_PLINE } from "@/lib/constants";

export default function AdminApprovalsPage() {
  const { userData } = useAuth();
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    loadReleases();
  }, []);

  const loadReleases = async () => {
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

  const handleApprove = async (release: any) => {
    setActionLoading(release.id);
    try {
      await updateDoc(doc(db, "releases", release.id), {
        status: "approved",
        approvedBy: userData?.uid,
        approvedAt: new Date().toISOString(),
        approvedByName: userData?.displayName,
      });
      toast.success("Release approved!");
      loadReleases();
      setSelectedRelease(null);
    } catch (err) {
      toast.error("Failed to approve");
    }
    setActionLoading("");
  };

  const handleReject = async (release: any) => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionLoading(release.id);
    try {
      await updateDoc(doc(db, "releases", release.id), {
        status: "rejected",
        rejectReason: rejectReason,
        rejectedBy: userData?.uid,
        rejectedAt: new Date().toISOString(),
        rejectedByName: userData?.displayName,
      });
      toast.success("Release rejected");
      loadReleases();
      setSelectedRelease(null);
      setRejectReason("");
    } catch (err) {
      toast.error("Failed to reject");
    }
    setActionLoading("");
  };

  const handleSubmitToApi = async (release: any) => {
    setActionLoading(release.id);
    try {
      const payload = buildApiPayload(release);
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
      });
      toast.success("Release submitted to DNM API!");
      loadReleases();
      setSelectedRelease(null);
    } catch (err: any) {
      toast.error(err.message || "API submission failed. Check API configuration.");
    }
    setActionLoading("");
  };

  const buildApiPayload = (release: any) => {
    const track = release.tracks?.[0] || {};
    return {
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
      originalReleaseDate: release.originalReleaseDate || undefined,
      presaveSpotify: release.presaveSpotify || undefined,
      presaveApple: release.presaveApple || undefined,
      exclusiveSpotify: release.exclusiveSpotify || undefined,
      exclusiveApple: release.exclusiveApple || undefined,
      labelName: release.labelName || DEFAULT_LABEL,
      cLine: release.cLine || DEFAULT_CLINE,
      pLine: release.pLine || DEFAULT_PLINE,
      upc: release.upc || undefined,
      youtubeContentId: release.youtubeContentId || "No",
      releasePreviouslyReleased: release.releasePreviouslyReleased || "No",
      cover_art_url: release.coverArtUrl,
      artists: (release.artists || []).map((a: any) => ({ name: a.name })),
      featuring_artists: (release.featuringArtists || []).map((a: any) => ({ name: a.name })),
      tracks: (release.tracks || []).map((t: any) => ({
        trackName: t.trackName,
        audio_url: t.audioUrl,
        trackGenre: t.trackGenre,
        trackSubgenre: t.trackSubgenre,
        trackLanguage: t.trackLanguage,
        isrc: t.isrc || undefined,
        trackVersion: t.trackVersion || undefined,
        previewStart: t.previewStart || "30",
        vocalist: t.vocalist || undefined,
        explicitLyrics: t.explicitLyrics || "No",
        trackLyrics: t.trackLyrics || undefined,
        previouslyReleased: t.previouslyReleased || "No",
        producers: t.producers || [],
        artist: (t.artists || []).map((a: any) => ({ name: a.name })),
        featuring_artists: (t.featuringArtists || []).map((a: any) => ({ name: a.name })),
        songwriters: (t.songwriters || []).map((sw: any) => ({ name: sw.name })),
        composers: (t.composers || []).map((c: any) => ({ name: c.name })),
      })),
    };
  };

  const filteredReleases = releases.filter((r) => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch =
      r.albumName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.submittedByName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
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
          <h1 className="text-2xl font-bold">Approvals</h1>
          <p className="text-zinc-400 text-sm mt-1">Review and manage releases</p>
        </div>
        <button onClick={loadReleases} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                filter === f ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >{f}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9 pr-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" placeholder="Search releases..." />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : filteredReleases.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p>No {filter === "all" ? "" : filter} releases found</p>
          </div>
        ) : (
          filteredReleases.map((release, i) => (
            <motion.div key={release.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/20 transition-all cursor-pointer"
              onClick={() => setSelectedRelease(selectedRelease?.id === release.id ? null : release)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  {release.coverArtUrl ? (
                    <img src={release.coverArtUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{release.albumName} {release.albumVersion && `(${release.albumVersion})`}</h3>
                    <p className="text-xs text-zinc-500">
                      {release.submittedByName} • {release.typeOfRelease} • {release.albumGenre}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      ID: {release.releaseId || release.id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${statusColors[release.status] || "text-zinc-400 bg-zinc-500/10"}`}>
                    {release.status}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {release.createdAt?.toDate?.() ? release.createdAt.toDate().toLocaleDateString() : ""}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {selectedRelease?.id === release.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-zinc-800 overflow-hidden"
                  >
                    <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                      <div><span className="text-zinc-500">Label:</span> {release.labelName}</div>
                      <div><span className="text-zinc-500">Copyright:</span> {release.cLine}</div>
                      <div><span className="text-zinc-500">Phonographic:</span> {release.pLine}</div>
                      <div><span className="text-zinc-500">Content Type:</span> {release.contentType}</div>
                      <div><span className="text-zinc-500">Release Date:</span> {release.trackReleaseDate}</div>
                      <div><span className="text-zinc-500">Tracks:</span> {release.tracks?.length || 0}</div>
                      {release.artists?.length > 0 && (
                        <div className="md:col-span-3">
                          <span className="text-zinc-500">Artists:</span> {release.artists.map((a: any) => a.name).join(", ")}
                        </div>
                      )}
                      {release.featuringArtists?.length > 0 && (
                        <div className="md:col-span-3">
                          <span className="text-zinc-500">Featuring:</span> {release.featuringArtists.map((a: any) => a.name).join(", ")}
                        </div>
                      )}
                      {release.rejectReason && (
                        <div className="md:col-span-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <span className="text-red-400 font-medium">Rejection Reason:</span>
                          <p className="text-red-300 text-sm mt-1">{release.rejectReason}</p>
                        </div>
                      )}
                      {release.notes && (
                        <div className="md:col-span-3">
                          <span className="text-zinc-500">Notes:</span> {release.notes}
                        </div>
                      )}
                    </div>

                    {release.tracks?.map((track: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] mb-2 text-sm">
                        <p className="font-medium">Track {idx + 1}: {track.trackName}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Genre: {track.trackGenre}/{track.trackSubgenre} • Language: {track.trackLanguage}
                          {track.explicitLyrics === "Yes" && " • 🔞 Explicit"}
                        </p>
                        {track.songwriters?.length > 0 && (
                          <p className="text-xs text-zinc-500">Songwriters: {track.songwriters.map((sw: any) => sw.name).join(", ")}</p>
                        )}
                        {track.composers?.length > 0 && (
                          <p className="text-xs text-zinc-500">Composers: {track.composers.map((c: any) => c.name).join(", ")}</p>
                        )}
                        {track.producers?.length > 0 && (
                          <p className="text-xs text-zinc-500">Producers: {track.producers.join(", ")}</p>
                        )}
                      </div>
                    ))}

                    <div className="flex gap-3 mt-4">
                      {release.status === "pending" && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); handleApprove(release); }}
                            disabled={actionLoading === release.id}
                            className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-800 rounded-lg text-sm flex items-center gap-2">
                            {actionLoading === release.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setRejectReason(""); handleReject(release); }}
                            disabled={actionLoading === release.id || !rejectReason.trim()}
                            className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 rounded-lg text-sm flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason..."
                            className="flex-1 px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                            onClick={(e) => e.stopPropagation()} />
                        </>
                      )}
                      {release.status === "approved" && (
                        <button onClick={(e) => { e.stopPropagation(); handleSubmitToApi(release); }}
                          disabled={actionLoading === release.id}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg text-sm flex items-center gap-2">
                          {actionLoading === release.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit to DNM API
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
