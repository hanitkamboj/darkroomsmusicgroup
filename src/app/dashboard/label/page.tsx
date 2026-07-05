"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Music, Users, Settings, CheckCircle, Disc3, Ticket, BarChart3 } from "lucide-react";

export default function LabelDashboardPage() {
  const { userData } = useAuth();

  const features = [
    { label: "Submit Releases", href: "/dashboard/artist/submit", icon: Music, desc: "Create and submit releases" },
    { label: "All Releases", href: "/dashboard/admin/releases", icon: Disc3, desc: "View all platform releases" },
    { label: "Approvals", href: "/dashboard/admin/approvals", icon: CheckCircle, desc: "Approve or reject releases" },
    { label: "User Management", href: "/dashboard/admin/users", icon: Users, desc: "Manage all users" },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings, desc: "Platform configuration" },
    { label: "Support Tickets", href: "/dashboard/admin/support", icon: Ticket, desc: "Customer support" },
    { label: "My Catalog", href: "/dashboard/artist/catalog", icon: Music, desc: "View your releases" },
    { label: "Profile", href: "/dashboard/artist/profile", icon: Shield, desc: "Manage your profile" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Label Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Full access • All features unlocked</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/20 to-amber-600/20 border border-purple-500/20">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium gradient-text">Label • Unlimited</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, i) => (
          <Link key={feature.label} href={feature.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 transition-all h-full"
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-600/20 to-amber-600/20 flex items-center justify-center mb-3">
                <feature.icon className="w-5.5 h-5.5 text-purple-400" />
              </div>
              <h3 className="font-semibold">{feature.label}</h3>
              <p className="text-xs text-zinc-500 mt-1">{feature.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-600/5 to-amber-600/5 border border-purple-500/10">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" /> Label Benefits
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm">
          <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="font-medium text-purple-300">Unlimited Releases</p>
            <p className="text-xs text-zinc-500 mt-1">No cap on monthly releases</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="font-medium text-purple-300">Priority Support</p>
            <p className="text-xs text-zinc-500 mt-1">24/7 dedicated support channel</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="font-medium text-purple-300">Full Admin Access</p>
            <p className="text-xs text-zinc-500 mt-1">Manage users, releases, settings</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="font-medium text-purple-300">Custom Branding</p>
            <p className="text-xs text-zinc-500 mt-1">Your label name on all releases</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="font-medium text-purple-300">Bulk Operations</p>
            <p className="text-xs text-zinc-500 mt-1">Submit on behalf of artists</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="font-medium text-purple-300">Revenue Reports</p>
            <p className="text-xs text-zinc-500 mt-1">Detailed analytics and earnings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
