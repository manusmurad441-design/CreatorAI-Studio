"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Video,
  FolderOpen,
  History,
  Bookmark,
  CreditCard,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile, Subscription } from "@/types/database";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Analyze Video", icon: Video },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/saved", label: "Saved Results", icon: Bookmark },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/account", label: "Account", icon: User },
];

interface SidebarProps {
  user: SupabaseUser;
  profile: Profile | null;
  subscription: Subscription | null;
}

export function Sidebar({ user, profile, subscription }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isPro =
    subscription?.status === "active" &&
    subscription?.plan === "pro" &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 hidden md:flex">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          CA
        </div>
        <span className="font-semibold">CreatorAI Studio</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
            {(profile?.display_name || user.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.display_name || user.email}
            </p>
            <p className="text-xs text-slate-500">
              {isPro ? "Pro plan" : "Free plan"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
