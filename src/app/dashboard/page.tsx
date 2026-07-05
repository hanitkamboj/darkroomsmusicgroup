"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Music, Disc3, TrendingUp, Users, Clock, AlertCircle,
  CheckCircle, ArrowRight, Upload, FileText, Ticket, BarChart3,
} from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardOverview() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalReleases: 0,
    approved: 0,
    pending: 0,
    drafts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData) return;
      const releasesRef = collection(db, "releases");
      const q = query(releasesRef, where("userId", "==", userData.uid));
      const snapshot = await getDocs(q);
      let approved = 0, pending = 0, drafts = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === "approved") approved++;
        else if (data.status === "pending") pending++;
        else if (data.status === "draft") drafts++;
      });
      setStats({ totalReleases: snapshot.size, approved, pending, drafts });

      const recentQ = query(releasesRef, where("userId", "==", userData.uid), orderBy("createdAt", "desc"), limit(5));
      const recentSnap = await getDocs(recentQ);
      setRecentActivity(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchStats();
  }, [userData]);

  const isAdmin = userData?.role === "admin" || userData?.role === "label";

  const statCards = [
    { label: "Total Releases", value: stats.totalReleases, icon: Disc3, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Drafts", value: stats.drafts, icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  const quickActions = [
    { label: "New Release", href: "/dashboard/artist/submit", icon: Upload, color: "bg-purple-600" },
    { label: "View Catalog", href: "/dashboard/artist/catalog", icon: Library, color: "bg-blue-600" },
    { label: "Support", href: "/dashboard/support", icon: Ticket, color: "bg-amber-600" },
    { label: "Profile", href: "/dashboard/artist/profile", icon: User, color: "bg-green-600" },
  ];

  const adminQuickActions = [
    { label: "Users", href: "/dashboard/admin/users", icon: Users, color: "bg-purple-600" },
    { label: "Approvals", href: "/dashboard/admin/approvals", icon: CheckCircle, color: "bg-blue-600" },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings, color: "bg-amber-600" },
    { label: "Support Tickets", href: "/dashboard/admin/support", icon: Ticket, color: "bg-green-600" },
  ];

  const actions = isAdmin ? adminQuickActions : quickActions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {userData?.displayName || "Artist"}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {isAdmin ? "Admin Dashboard" : "Artist Dashboard"} • {userData?.plan || "Free"} Plan
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-zinc-300">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actions.map((action, i) => (
              <Link key={action.label} href={action.href}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-medium">{action.label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <Music className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No releases yet</p>
                <Link href="/dashboard/artist/submit">
                  <span className="text-xs text-purple-400 hover:text-purple-300 mt-1 inline-block">
                    Submit your first release →
                  </span>
                </Link>
              </div>
            ) : (
              recentActivity.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === "approved" ? "bg-green-400" :
                    item.status === "pending" ? "bg-amber-400" : "bg-zinc-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.albumName || item.trackName}</p>
                    <p className="text-xs text-zinc-500 capitalize">{item.status}</p>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {item.createdAt ? new Date(item.createdAt.toDate?.() || item.createdAt).toLocaleDateString() : ""}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Need these imports for the quick actions
import { Library, User, Settings } from "lucide-react";
