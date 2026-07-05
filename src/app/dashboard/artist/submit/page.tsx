"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import {
  Music, Upload, Image, Headphones, Users, Plus, X, Trash2,
  Save, Send, ChevronDown, AlertCircle, CheckCircle, Loader2,
} from "lucide-react";
import { GENRES, LANGUAGES, CONTENT_TYPES, RELEASE_TYPES, DEFAULT_LABEL, DEFAULT_CLINE, DEFAULT_PLINE } from "@/lib/constants";

interface ArtistCredit {
  id: string;
  name: string;
  role: "artist" | "featuring" | "songwriter" | "composer" | "producer";
  ipi?: string;
  spotify_url?: string;
  apple_url?: string;
  youtube_url?: string;
  instagram_url?: string;
}

interface Track {
  id: string;
  trackName: string;
  audioFile: File | null;
  audioUrl?: string;
  trackGenre: string;
  trackSubgenre: string;
  trackLanguage: string;
  isrc?: string;
  trackVersion: string;
  previewStart: string;
  vocalist: string;
  explicitLyrics: "Yes" | "No";
  trackLyrics: string;
  previouslyReleased: "Yes" | "No";
  producers: string[];
  artists: ArtistCredit[];
  featuringArtists: ArtistCredit[];
  songwriters: ArtistCredit[];
  composers: ArtistCredit[];
}

export default function SubmitReleasePage() {
  const { userData } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [savedArtists, setSavedArtists] = useState<ArtistCredit[]>([]);
  const coverArtInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    albumName: "",
    albumVersion: "",
    typeOfRelease: "Single",
    albumGenre: "Indian",
    albumSubgenre: "Bollywood",
    albumLanguage: "Hindi",
    contentType: "Original/Exclusive Licensed",
    trackReleaseDate: "",
    originalReleaseDate: "",
    presaveSpotify: "",
    presaveApple: "",
    exclusiveSpotify: "",
    exclusiveApple: "",
    labelName: DEFAULT_LABEL,
    cLine: DEFAULT_CLINE,
    pLine: DEFAULT_PLINE,
    upc: "",
    youtubeContentId: "No",
    releasePreviouslyReleased: "No",
    notes: "",
    coverArt: null as File | null,
    coverArtPreview: "",
    artists: [] as ArtistCredit[],
    featuringArtists: [] as ArtistCredit[],
    tracks: [] as Track[],
  });

  const addTrack = () => {
    const newTrack: Track = {
      id: uuidv4(),
      trackName: "",
      audioFile: null,
      trackGenre: form.albumGenre,
      trackSubgenre: form.albumSubgenre,
      trackLanguage: form.albumLanguage,
      trackVersion: "",
      previewStart: "30",
      vocalist: "",
      explicitLyrics: "No",
      trackLyrics: "",
      previouslyReleased: "No",
      producers: [],
      artists: [],
      featuringArtists: [],
      songwriters: [],
      composers: [],
    };
    setForm({ ...form, tracks: [...form.tracks, newTrack] });
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setForm({
      ...form,
      tracks: form.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });
  };

  const removeTrack = (id: string) => {
    setForm({ ...form, tracks: form.tracks.filter((t) => t.id !== id) });
  };

  const addArtistCredit = (
    name: string,
    role: ArtistCredit["role"],
    trackId?: string
  ) => {
    const newArtist: ArtistCredit = {
      id: uuidv4(),
      name,
      role,
    };
    setSavedArtists([...savedArtists, newArtist]);
    if (trackId) {
      let key: string | null = null;
      if (role === "artist") key = "artists";
      else if (role === "featuring") key = "featuringArtists";
      else if (role === "songwriter") key = "songwriters";
      else if (role === "composer") key = "composers";
      if (key) {
        updateTrack(trackId, {
          [key]: [...(form.tracks.find((t) => t.id === trackId)?.[key as keyof Track] as ArtistCredit[] || []), newArtist],
        } as any);
      }
    }
  };

  const handleCoverArt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setForm({ ...form, coverArt: file, coverArtPreview: URL.createObjectURL(file) });
  };

  const handleAudioUpload = (trackId: string, file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }
    updateTrack(trackId, { audioFile: file });
  };

  const processCoverArt = async (file: File): Promise<Blob> => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = url;
    });
    URL.revokeObjectURL(url);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const targetSize = 3000;
    canvas.width = targetSize;
    canvas.height = targetSize;
    ctx.imageSmoothingQuality = "high";
    const offsetX = (targetSize - img.width) / 2;
    const offsetY = (targetSize - img.height) / 2;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, targetSize, targetSize);
    ctx.drawImage(img, Math.max(0, offsetX), Math.max(0, offsetY), Math.min(img.width, targetSize), Math.min(img.height, targetSize));

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.98);
    });
  };

  const validateAudio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const audioContext = new AudioContext();
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = await audioContext.decodeAudioData(e.target!.result as ArrayBuffer);
          const sampleRate = buffer.sampleRate;
          const bitDepth = 16;
          if (sampleRate < 44100) {
            toast.error("Audio sample rate must be at least 44.1kHz. Please upload a higher quality file.");
            resolve(false);
          } else if (sampleRate > 48000) {
            toast.success("Audio will be downsampled to 44.1kHz");
            resolve(true);
          } else {
            resolve(true);
          }
        } catch {
          toast.error("Could not validate audio file. Please upload a standard format.");
          resolve(false);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadFile = async (file: Blob | File, path: string): Promise<string> => {
    const storageRef = ref(storage, `uploads/${userData?.uid}/${path}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (status: "draft" | "pending") => {
    if (!userData) return;
    if (status === "pending") {
      if (!form.albumName || form.tracks.length === 0) {
        toast.error("Album name and at least one track are required");
        return;
      }
      if (!form.coverArt) {
        toast.error("Cover art is required");
        return;
      }
    }

    setSubmitting(true);
    try {
      let coverArtUrl = "";
      if (form.coverArt) {
        const processedCover = await processCoverArt(form.coverArt);
        coverArtUrl = await uploadFile(processedCover, `covers/${uuidv4()}.jpg`);
      }

      const trackData = await Promise.all(
        form.tracks.map(async (track) => {
          let audioUrl = "";
          if (track.audioFile) {
            const isValid = await validateAudio(track.audioFile);
            if (isValid) {
              audioUrl = await uploadFile(track.audioFile, `audio/${uuidv4()}_${track.audioFile.name}`);
            }
          }
          return {
            trackName: track.trackName,
            audioUrl,
            audioFile: track.audioFile?.name,
            trackGenre: track.trackGenre,
            trackSubgenre: track.trackSubgenre,
            trackLanguage: track.trackLanguage,
            isrc: track.isrc,
            trackVersion: track.trackVersion,
            previewStart: track.previewStart,
            vocalist: track.vocalist,
            explicitLyrics: track.explicitLyrics,
            trackLyrics: track.trackLyrics,
            previouslyReleased: track.previouslyReleased,
            producers: track.producers,
            artists: track.artists,
            featuringArtists: track.featuringArtists,
            songwriters: track.songwriters,
            composers: track.composers,
          };
        })
      );

      const releaseId = uuidv4().slice(0, 8).toUpperCase();
      const releaseData = {
        releaseId: `DMG-${releaseId}`,
        userId: userData.uid,
        userEmail: userData.email,
        status,
        ...form,
        coverArtUrl,
        tracks: trackData,
        coverArt: undefined,
        coverArtPreview: undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        submittedBy: userData.uid,
        submittedByName: userData.displayName,
      };

      await addDoc(collection(db, "releases"), releaseData);
      toast.success(status === "draft" ? "Saved as draft!" : "Release submitted for approval!");

      setForm({
        albumName: "", albumVersion: "", typeOfRelease: "Single",
        albumGenre: "Indian", albumSubgenre: "Bollywood", albumLanguage: "Hindi",
        contentType: "Original/Exclusive Licensed", trackReleaseDate: "",
        originalReleaseDate: "", presaveSpotify: "", presaveApple: "",
        exclusiveSpotify: "", exclusiveApple: "",
        labelName: DEFAULT_LABEL, cLine: DEFAULT_CLINE, pLine: DEFAULT_PLINE,
        upc: "", youtubeContentId: "No", releasePreviouslyReleased: "No", notes: "",
        coverArt: null, coverArtPreview: "", artists: [], featuringArtists: [], tracks: [],
      });
      setStep(1);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit release");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Submit New Release</h1>
          <p className="text-zinc-400 text-sm mt-1">Fill in the details below to distribute your music</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              ${step === s ? "bg-purple-600 text-white" : step > s ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-500"}
            `}>{step > s ? <CheckCircle className="w-4 h-4" /> : s}</div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Music className="w-5 h-5 text-purple-400" /> Release Details</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Album / Song Title *</label>
                <input type="text" value={form.albumName} onChange={(e) => setForm({ ...form, albumName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" placeholder="Enter title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Version</label>
                <input type="text" value={form.albumVersion} onChange={(e) => setForm({ ...form, albumVersion: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" placeholder="e.g. Deluxe Edition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Release Type *</label>
                <select value={form.typeOfRelease} onChange={(e) => setForm({ ...form, typeOfRelease: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                  {RELEASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Genre *</label>
                <select value={form.albumGenre} onChange={(e) => setForm({ ...form, albumGenre: e.target.value, albumSubgenre: GENRES[e.target.value]?.[0] || "" })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                  {Object.keys(GENRES).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Subgenre</label>
                <select value={form.albumSubgenre} onChange={(e) => setForm({ ...form, albumSubgenre: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                  {(GENRES[form.albumGenre] || []).map((sg) => <option key={sg} value={sg}>{sg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Language</label>
                <select value={form.albumLanguage} onChange={(e) => setForm({ ...form, albumLanguage: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Content Type</label>
                <select value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                  {CONTENT_TYPES.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Release Date *</label>
                <input type="date" value={form.trackReleaseDate} onChange={(e) => setForm({ ...form, trackReleaseDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Image className="w-5 h-5 text-purple-400" /> Cover Art</h2>
            <div className="flex items-center gap-6">
              <div
                onClick={() => coverArtInputRef.current?.click()}
                className="w-40 h-40 rounded-xl border-2 border-dashed border-zinc-700 hover:border-purple-500 cursor-pointer flex items-center justify-center overflow-hidden bg-white/5"
              >
                {form.coverArtPreview ? (
                  <img src={form.coverArtPreview} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Click to upload</p>
                    <p className="text-[10px] text-zinc-600 mt-1">3000x3000 or 1400x1400</p>
                  </div>
                )}
              </div>
              <input ref={coverArtInputRef} type="file" accept="image/*" onChange={handleCoverArt} className="hidden" />
              <div className="text-sm text-zinc-400">
                <p>Recommended: 3000x3000px JPEG</p>
                <p className="text-xs text-zinc-500 mt-1">Will be automatically converted to 3000x3000 JPEG</p>
                <p className="text-xs text-zinc-500">Supported: PNG, JPEG, WEBP</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" /> Artists</h2>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Main Artist(s)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.artists.map((a) => (
                  <span key={a.id} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center gap-1">
                    {a.name} <X className="w-3 h-3 cursor-pointer" onClick={() => setForm({ ...form, artists: form.artists.filter((x) => x.id !== a.id) })} />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Artist name" id="artist-input"
                  className="flex-1 px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
                <button type="button" onClick={() => {
                  const input = document.getElementById("artist-input") as HTMLInputElement;
                  if (input.value.trim()) {
                    addArtistCredit(input.value.trim(), "artist");
                    setForm({ ...form, artists: [...form.artists, { id: uuidv4(), name: input.value.trim(), role: "artist" }] });
                    input.value = "";
                  }
                }} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors">Add</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Featuring Artists</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.featuringArtists.map((a) => (
                  <span key={a.id} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs flex items-center gap-1">
                    {a.name} <X className="w-3 h-3 cursor-pointer" onClick={() => setForm({ ...form, featuringArtists: form.featuringArtists.filter((x) => x.id !== a.id) })} />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Featuring artist" id="feat-input"
                  className="flex-1 px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
                <button type="button" onClick={() => {
                  const input = document.getElementById("feat-input") as HTMLInputElement;
                  if (input.value.trim()) {
                    addArtistCredit(input.value.trim(), "featuring");
                    setForm({ ...form, featuringArtists: [...form.featuringArtists, { id: uuidv4(), name: input.value.trim(), role: "featuring" }] });
                    input.value = "";
                  }
                }} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm transition-colors">Add</button>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} disabled className="px-6 py-2.5 bg-zinc-800 text-zinc-400 rounded-lg">Previous</button>
            <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors">Next: Tracks</button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Headphones className="w-5 h-5 text-purple-400" /> Tracks</h2>
            <button onClick={addTrack} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Track
            </button>
          </div>

          {form.tracks.length === 0 && (
            <div className="p-12 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
              <Music className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No tracks added yet</p>
              <p className="text-sm text-zinc-500 mt-1">Add at least one track to continue</p>
            </div>
          )}

          <AnimatePresence>
            {form.tracks.map((track, idx) => (
              <motion.div key={track.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-300 text-xs flex items-center justify-center">{idx + 1}</span>
                    Track {idx + 1}
                  </h3>
                  <button onClick={() => removeTrack(track.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Track Name *</label>
                    <input type="text" value={track.trackName} onChange={(e) => updateTrack(track.id, { trackName: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" placeholder="Track title" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Audio File *</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 border border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                        <Upload className="w-5 h-5 text-zinc-400" />
                        <span className="text-sm text-zinc-400">{track.audioFile ? track.audioFile.name : "Upload WAV / FLAC / MP3"}</span>
                        <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && handleAudioUpload(track.id, e.target.files[0])} className="hidden" />
                      </label>
                      {track.audioFile && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Loaded
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">Accepted: 16/24bit • 44.1kHz • WAV, FLAC, MP3, AIFF</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Genre</label>
                    <select value={track.trackGenre} onChange={(e) => updateTrack(track.id, { trackGenre: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                      {Object.keys(GENRES).map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Subgenre</label>
                    <select value={track.trackSubgenre} onChange={(e) => updateTrack(track.id, { trackSubgenre: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                      {(GENRES[track.trackGenre] || []).map((sg) => <option key={sg} value={sg}>{sg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Language</label>
                    <select value={track.trackLanguage} onChange={(e) => updateTrack(track.id, { trackLanguage: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                      {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Version</label>
                    <input type="text" value={track.trackVersion} onChange={(e) => updateTrack(track.id, { trackVersion: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" placeholder="Original / Remix" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Vocalist</label>
                    <input type="text" value={track.vocalist} onChange={(e) => updateTrack(track.id, { vocalist: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" placeholder="Singer name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Preview Start (seconds)</label>
                    <input type="number" value={track.previewStart} onChange={(e) => updateTrack(track.id, { previewStart: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Explicit Lyrics</label>
                    <select value={track.explicitLyrics} onChange={(e) => updateTrack(track.id, { explicitLyrics: e.target.value as "Yes" | "No" })}
                      className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Lyrics</label>
                    <textarea value={track.trackLyrics} onChange={(e) => updateTrack(track.id, { trackLyrics: e.target.value })}
                      rows={3} className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" placeholder="Enter lyrics..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Producers</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {track.producers.map((p, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center gap-1">
                          {p} <X className="w-3 h-3 cursor-pointer" onClick={() => updateTrack(track.id, { producers: track.producers.filter((_, j) => j !== i) })} />
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" id={`producer-${track.id}`} placeholder="Producer name"
                        className="flex-1 px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
                      <button type="button" onClick={() => {
                        const input = document.getElementById(`producer-${track.id}`) as HTMLInputElement;
                        if (input.value.trim()) {
                          updateTrack(track.id, { producers: [...track.producers, input.value.trim()] });
                          input.value = "";
                        }
                      }} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm">Add</button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Songwriters (Author/Composer)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {track.songwriters.map((sw) => (
                        <span key={sw.id} className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs flex items-center gap-1">
                          {sw.name} <X className="w-3 h-3 cursor-pointer" onClick={() => updateTrack(track.id, { songwriters: track.songwriters.filter((x) => x.id !== sw.id) })} />
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" id={`songwriter-${track.id}`} placeholder="Songwriter name"
                        className="flex-1 px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
                      <button type="button" onClick={() => {
                        const input = document.getElementById(`songwriter-${track.id}`) as HTMLInputElement;
                        if (input.value.trim()) {
                          const newSw: ArtistCredit = { id: uuidv4(), name: input.value.trim(), role: "songwriter" };
                          addArtistCredit(input.value.trim(), "songwriter");
                          updateTrack(track.id, { songwriters: [...track.songwriters, newSw] });
                          input.value = "";
                        }
                      }} className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm">Add</button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Composers</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {track.composers.map((c) => (
                        <span key={c.id} className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs flex items-center gap-1">
                          {c.name} <X className="w-3 h-3 cursor-pointer" onClick={() => updateTrack(track.id, { composers: track.composers.filter((x) => x.id !== c.id) })} />
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" id={`composer-${track.id}`} placeholder="Composer name"
                        className="flex-1 px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
                      <button type="button" onClick={() => {
                        const input = document.getElementById(`composer-${track.id}`) as HTMLInputElement;
                        if (input.value.trim()) {
                          const newComp: ArtistCredit = { id: uuidv4(), name: input.value.trim(), role: "composer" };
                          addArtistCredit(input.value.trim(), "composer");
                          updateTrack(track.id, { composers: [...track.composers, newComp] });
                          input.value = "";
                        }
                      }} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm">Add</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Previous</button>
            <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors">Next: Review</button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
            <h2 className="text-lg font-semibold">Review & Submit</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Album Title</p>
                <p className="font-medium">{form.albumName || "—"}</p>
              </div>
              <div>
                <p className="text-zinc-500">Type</p>
                <p className="font-medium">{form.typeOfRelease}</p>
              </div>
              <div>
                <p className="text-zinc-500">Genre</p>
                <p className="font-medium">{form.albumGenre} / {form.albumSubgenre}</p>
              </div>
              <div>
                <p className="text-zinc-500">Language</p>
                <p className="font-medium">{form.albumLanguage}</p>
              </div>
              <div>
                <p className="text-zinc-500">Content Type</p>
                <p className="font-medium">{form.contentType}</p>
              </div>
              <div>
                <p className="text-zinc-500">Tracks</p>
                <p className="font-medium">{form.tracks.length} track(s)</p>
              </div>
              <div>
                <p className="text-zinc-500">Artists</p>
                <p className="font-medium">{form.artists.map((a) => a.name).join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-zinc-500">Featuring</p>
                <p className="font-medium">{form.featuringArtists.map((a) => a.name).join(", ") || "None"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-zinc-500">Label</p>
                <p className="font-medium">{form.labelName}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-zinc-500">Copyright Line</p>
                <p className="font-medium">{form.cLine}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-zinc-500">Phonographic Line</p>
                <p className="font-medium">{form.pLine}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.03] border border-zinc-800 space-y-3">
            <h3 className="font-medium text-sm">Release Notes (Internal)</h3>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3} className="w-full px-4 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="Any notes for the admin..." />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Previous</button>
            <div className="flex gap-3">
              <button onClick={() => handleSubmit("draft")} disabled={submitting}
                className="px-6 py-2.5 border border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save as Draft
              </button>
              <button onClick={() => handleSubmit("pending")} disabled={submitting}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit for Approval
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
