"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Music, Shield, Headphones, Globe, ArrowRight, Disc3, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-black to-amber-950/20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Disc3 className="w-8 h-8 text-purple-400" />
          <span className="text-xl font-bold gradient-text">Darkrooms Music Group</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded-full transition-all font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Next-Gen Music Distribution Platform
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Distribute Your Music to the{" "}
            <span className="gradient-text">World</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Darkrooms Music Group empowers artists to distribute their music globally.
            Upload, manage, and release your tracks with powerful tools and analytics.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-full font-medium text-lg transition-all flex items-center gap-2 pulse-glow"
            >
              Start Distributing <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-zinc-700 hover:border-zinc-500 rounded-full font-medium text-lg transition-all"
            >
              Artist Login
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="grid md:grid-cols-3 gap-6 mt-32"
        >
          {[
            { icon: Music, title: "Global Distribution", desc: "Release your music across all major streaming platforms worldwide with a single click." },
            { icon: Shield, title: "Full Rights Control", desc: "Maintain 100% ownership of your music. Choose your label, copyright, and licensing terms." },
            { icon: Headphones, title: "Professional Processing", desc: "Automatic audio mastering and artwork optimization to meet platform requirements." },
            { icon: Globe, title: "Multi-Platform", desc: "Distribute to Spotify, Apple Music, YouTube Music, Amazon Music, and 150+ platforms." },
            { icon: Disc3, title: "Catalog Management", desc: "Manage your entire discography, credits, songwriters, and collaborators in one place." },
            { icon: Sparkles, title: "Real-Time Analytics", desc: "Track your streams, revenue, and audience growth with detailed analytics dashboard." },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 transition-all"
            >
              <item.icon className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-24 text-zinc-500 text-sm"
        >
          <p>© 2026 Darkrooms Music Group. All rights reserved.</p>
          <p className="mt-1">℗ 2026 Darkrooms Music Group</p>
        </motion.div>
      </main>
    </div>
  );
}
