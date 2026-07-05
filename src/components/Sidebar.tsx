"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Music, Disc3, FolderOpen, Users, Settings,
  Headphones, Ticket, Shield, UserCircle, LogOut, ChevronLeft,
  FileText, CheckCircle, Radio, Library, Menu, X,
} from "lucide-react";
import { useState } from "react";

const artistLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/artist/submit", icon: Music, label: "Submit Release" },
  { href: "/dashboard/artist/catalog", icon: Library, label: "My Catalog" },
  { href: "/dashboard/artist/drafts", icon: FileText, label: "Drafts" },
  { href: "/dashboard/artist/releases", icon: Disc3, label: "Releases" },
  { href: "/dashboard/artist/credits", icon: Users, label: "Credits & Artists" },
  { href: "/dashboard/support", icon: Ticket, label: "Support" },
  { href: "/dashboard/artist/profile", icon: UserCircle, label: "Profile" },
];

const adminLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/admin/users", icon: Users, label: "User Management" },
  { href: "/dashboard/admin/approvals", icon: CheckCircle, label: "Approvals" },
  { href: "/dashboard/admin/releases", icon: Disc3, label: "All Releases" },
  { href: "/dashboard/admin/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/admin/support", icon: Ticket, label: "Support Tickets" },
  { href: "/dashboard/artist/submit", icon: Music, label: "Submit Release" },
  { href: "/dashboard/support", icon: Headphones, label: "Support" },
  { href: "/dashboard/artist/profile", icon: UserCircle, label: "Profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userData, logout } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = userData?.role === "admin" || userData?.role === "label" ? adminLinks : artistLinks;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-700"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className={`fixed inset-0 bg-black/50 z-30 lg:hidden ${mobileOpen ? "block" : "hidden"}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`fixed top-0 left-0 z-40 h-full bg-[#0a0a14] border-r border-zinc-800 transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Disc3 className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-sm gradient-text">Darkrooms</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto">
              <Disc3 className="w-6 h-6 text-purple-400" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="p-2 space-y-1 overflow-y-auto scrollbar-hide h-[calc(100%-140px)]">
          {links.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                    ${isActive
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <link.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-800 bg-[#0a0a14]">
          {!collapsed && userData && (
            <div className="px-2 pb-2">
              <p className="text-xs text-zinc-500 truncate">{userData.displayName}</p>
              <p className="text-xs text-zinc-600 truncate">{userData.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all w-full ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
