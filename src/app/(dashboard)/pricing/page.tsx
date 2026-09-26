"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to start checkout");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Pricing</h1>
      <p className="text-slate-600 mb-10">
        Choose the plan that fits your content creation needs.
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        {/* Free */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="text-3xl font-bold mt-2">
            $0<span className="text-base font-normal text-slate-500">/mo</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> 3 AI analyses / month
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Titles, description, SEO tags
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Hooks & content analysis
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Basic history
            </li>
          </ul>
          <button
            disabled
            className="mt-8 w-full py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-500 cursor-default"
          >
            Current plan
          </button>
        </div>

        {/* Pro */}
        <div className="bg-white border-2 border-blue-600 rounded-xl p-6 relative">
          <span className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-medium px-3 py-0.5 rounded-full">
            Recommended
          </span>
          <h2 className="text-lg font-semibold">Pro</h2>
          <p className="text-3xl font-bold mt-2">
            $19<span className="text-base font-normal text-slate-500">/mo</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> 50 AI analyses / month
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Everything in Free
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Thumbnail & Shorts ideas
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Next video ideas & optimization
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Priority processing
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Projects & saved results
            </li>
          </ul>
          <button
            onClick={startCheckout}
            disabled={loading}
            className="mt-8 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Redirecting…" : "Upgrade to Pro"}
          </button>
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Payments are processed securely by Stripe. You can cancel anytime.
      </p>
    </div>
  );
}
