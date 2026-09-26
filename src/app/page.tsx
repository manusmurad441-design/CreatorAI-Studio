import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              CA
            </div>
            <span className="font-semibold text-lg">CreatorAI Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl text-center py-20">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Turn your videos into{" "}
            <span className="text-blue-600">high-performing content</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            Upload any video. Get AI-generated titles, descriptions, SEO tags,
            hooks, thumbnail concepts, Shorts ideas, and optimization
            suggestions — based on the actual content of your video.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Start analyzing for free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center border border-slate-300 bg-white text-slate-700 px-8 py-3 rounded-lg font-medium hover:bg-slate-50 transition"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Free plan includes 3 analyses per month. No credit card required.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} CreatorAI Studio
      </footer>
    </div>
  );
}
