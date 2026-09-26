import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/types/database";

export default async function AccountPage() {
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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("action", "analysis")
    .gte("created_at", startOfMonth.toISOString());

  const limit = isPro ? PLAN_LIMITS.pro.monthly_analyses : PLAN_LIMITS.free.monthly_analyses;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Account</h1>
      <p className="text-slate-600 mb-8">Your account details and usage</p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg space-y-5">
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Display name</p>
          <p className="font-medium">{profile?.display_name || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Plan</p>
          <p className="font-medium capitalize">{isPro ? "Pro" : "Free"}</p>
        </div>
        {isPro && subscription?.expires_at && (
          <div>
            <p className="text-sm text-slate-500">Renews / expires</p>
            <p className="font-medium">
              {new Date(subscription.expires_at).toLocaleDateString()}
            </p>
          </div>
        )}
        <div>
          <p className="text-sm text-slate-500">Analyses this month</p>
          <p className="font-medium">
            {count ?? 0} / {limit}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Member since</p>
          <p className="font-medium">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
