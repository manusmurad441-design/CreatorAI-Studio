import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Video, FolderOpen, Zap, Crown } from "lucide-react";
import { PLAN_LIMITS } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPro =
    subscription?.status === "active" &&
    subscription?.plan === "pro" &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  // Usage this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: usageCount } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("action", "analysis")
    .gte("created_at", startOfMonth.toISOString());

  const limit = isPro
    ? PLAN_LIMITS.pro.monthly_analyses
    : PLAN_LIMITS.free.monthly_analyses;

  // Recent analyses
  const { data: recentAnalyses } = await supabase
    .from("ai_analyses")
    .select("id, created_at, video_id, videos(filename, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent projects
  const { data: recentProjects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(4);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="text-slate-600 mt-1">
            Analyze videos and optimize your content with AI
          </p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <Video className="w-4 h-4" />
          Analyze Video
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Usage this month</span>
          </div>
          <p className="text-2xl font-bold">
            {usageCount ?? 0}{" "}
            <span className="text-base font-normal text-slate-500">/ {limit}</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Crown className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Current plan</span>
          </div>
          <p className="text-2xl font-bold capitalize">
            {isPro ? "Pro" : "Free"}
          </p>
          {!isPro && (
            <Link href="/pricing" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
              Upgrade to Pro →
            </Link>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FolderOpen className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Projects</span>
          </div>
          <p className="text-2xl font-bold">{recentProjects?.length ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent analyses */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent analyses</h2>
            <Link href="/history" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentAnalyses && recentAnalyses.length > 0 ? (
            <ul className="space-y-3">
              {recentAnalyses.map((a: any) => (
                <li key={a.id}>
                  <Link
                    href={`/history/${a.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span className="text-sm font-medium truncate">
                      {a.videos?.filename || "Untitled"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">
              No analyses yet.{" "}
              <Link href="/analyze" className="text-blue-600 hover:underline">
                Analyze your first video
              </Link>
            </p>
          )}
        </div>

        {/* Recent projects */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent projects</h2>
            <Link href="/projects" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentProjects && recentProjects.length > 0 ? (
            <ul className="space-y-3">
              {recentProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">
              No projects yet.{" "}
              <Link href="/projects" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
