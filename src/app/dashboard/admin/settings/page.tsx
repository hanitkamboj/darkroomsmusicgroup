"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Settings, Save, Shield, ToggleLeft, Music, Globe } from "lucide-react";
import { DEFAULT_LABEL, DEFAULT_CLINE, DEFAULT_PLINE } from "@/lib/constants";

export default function AdminSettingsPage() {
  const { userData } = useAuth();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    defaultLabel: DEFAULT_LABEL,
    defaultCLine: DEFAULT_CLINE,
    defaultPLine: DEFAULT_PLINE,
    allowCustomLabel: true,
    allowCustomCopyright: true,
    allowCustomPhonographic: true,
    requireArtworkApproval: true,
    requireAudioApproval: true,
    autoProcessArtwork: true,
    autoProcessAudio: true,
    apiEndpoint: "https://dashboard.direnotemedia.com/ingest_api",
    apiClientId: "20260522_darkroomsmusicgroup@gmail.com",
    apiPin: "89657958",
    supportEmail: "support@darkroomsmusicgroup.com",
    platformName: "Darkrooms Music Group",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, "settings", "platform");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings({ ...settings, ...docSnap.data() });
      }
    } catch (err) {
      console.error("Failed to load settings");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "platform"), settings);
      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const toggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure global platform settings</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 rounded-lg text-sm flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-5">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Music className="w-5 h-5 text-purple-400" /> Label & Copyright Defaults</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Default Label Name</label>
            <input type="text" value={settings.defaultLabel} onChange={(e) => setSettings({ ...settings, defaultLabel: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Default Copyright Line (cLine)</label>
            <input type="text" value={settings.defaultCLine} onChange={(e) => setSettings({ ...settings, defaultCLine: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Default Phonographic Line (pLine)</label>
            <input type="text" value={settings.defaultPLine} onChange={(e) => setSettings({ ...settings, defaultPLine: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-5">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-purple-400" /> Permissions</h2>
        <p className="text-sm text-zinc-500 mb-2">Control what artists can customize</p>
        <div className="space-y-3">
          {[
            { key: "allowCustomLabel" as const, label: "Allow Custom Label Name", desc: "Artists can set their own label name" },
            { key: "allowCustomCopyright" as const, label: "Allow Custom Copyright Line", desc: "Artists can customize the copyright line" },
            { key: "allowCustomPhonographic" as const, label: "Allow Custom Phonographic Line", desc: "Artists can customize the phonographic rights line" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
              <button onClick={() => toggle(item.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key] ? "bg-purple-600" : "bg-zinc-700"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings[item.key] ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-5">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-purple-400" /> API Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">API Endpoint</label>
            <input type="text" value={settings.apiEndpoint} onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Client ID</label>
              <input type="text" value={settings.apiClientId} onChange={(e) => setSettings({ ...settings, apiClientId: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">API PIN</label>
              <input type="text" value={settings.apiPin} onChange={(e) => setSettings({ ...settings, apiPin: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-5">
        <h2 className="text-lg font-semibold flex items-center gap-2"><ToggleLeft className="w-5 h-5 text-purple-400" /> Auto-Processing</h2>
        <div className="space-y-3">
          {[
            { key: "autoProcessArtwork" as const, label: "Auto-Process Artwork", desc: "Convert artwork to 3000x3000 JPEG automatically" },
            { key: "autoProcessAudio" as const, label: "Auto-Process Audio", desc: "Validate and convert audio to 24bit/44.1kHz" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
              <button onClick={() => toggle(item.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key] ? "bg-purple-600" : "bg-zinc-700"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings[item.key] ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
