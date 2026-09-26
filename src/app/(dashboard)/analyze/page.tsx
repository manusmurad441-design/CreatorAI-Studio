"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatBytes } from "@/lib/utils";
import toast from "react-hot-toast";
import { Upload, Loader2, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import type { AIAnalysis } from "@/types/database";

const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE = 500 * 1024 * 1024;

type Stage = "idle" | "uploading" | "analyzing" | "completed" | "failed";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("titles");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function onSelect(f: File) {
    if (!ACCEPTED.includes(f.type)) {
      toast.error("Use MP4, MOV or WebM");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("Max 500MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAnalysis(null);
    setError(null);
    setStage("idle");
  }

  async function run() {
    if (!file) return;
    setError(null);
    setStage("uploading");
    setProgress(10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Usage check
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const isPro =
        sub?.status === "active" &&
        sub?.plan === "pro" &&
        (!sub.expires_at || new Date(sub.expires_at) > new Date());

      const { count } = await supabase
        .from("usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", "analysis")
        .gte("created_at", start.toISOString());

      if ((count ?? 0) >= (isPro ? 50 : 3)) {
        throw new Error(
          isPro
            ? "Pro monthly limit reached"
            : "Free plan limit (3/month) reached. Upgrade to Pro."
        );
      }

      const path = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      setProgress(25);

      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (upErr) throw upErr;
      setProgress(50);

      const { data: video, error: vErr } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          filename: file.name,
          file_url: path,
          file_size: file.size,
          mime_type: file.type,
          status: "uploaded",
        })
        .select()
        .single();

      if (vErr) throw vErr;
      setProgress(60);
      setStage("analyzing");

      const fd = new FormData();
      fd.append("videoId", video.id);
      fd.append("filePath", path);
      fd.append("filename", file.name);
      fd.append("mimeType", file.type);

      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");

      setAnalysis(json.analysis);
      setStage("completed");
      setProgress(100);
      toast.success("Analysis complete!");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed");
      setStage("failed");
      toast.error(e.message || "Failed");
    }
  }

  function copy(t: string) {
    navigator.clipboard.writeText(t);
    toast.success("Copied");
  }

  const tabs = [
    "titles",
    "description",
    "seo_tags",
    "hooks",
    "content_analysis",
    "thumbnail_ideas",
    "shorts_ideas",
    "next_video_ideas",
    "optimization",
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Analyze Video</h1>
      <p className="text-slate-600 mb-8">
        Upload a real video. Results are generated from its actual content.
      </p>

      {!analysis && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          {!file ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) onSelect(f);
              }}
              className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition"
            >
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-medium">Drop video or click to browse</p>
              <p className="text-sm text-slate-500 mt-1">MP4 · MOV · WebM · max 500 MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {preview && (
                <video src={preview} controls className="w-full max-h-72 rounded-lg bg-black" />
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-slate-500">{formatBytes(file.size)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setStage("idle");
                    }}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Change
                  </button>
                  <button
                    onClick={run}
                    disabled={stage === "uploading" || stage === "analyzing"}
                    className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {(stage === "uploading" || stage === "analyzing") && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {stage === "idle" || stage === "failed"
                      ? "Start Analysis"
                      : stage === "uploading"
                      ? "Uploading…"
                      : "Analyzing with Gemini…"}
                  </button>
                </div>
              </div>

              {(stage === "uploading" || stage === "analyzing") && (
                <div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-1.5 capitalize">{stage}…</p>
                </div>
              )}

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {analysis && (
        <div>
          <div className="flex items-center gap-2 mb-5 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Analysis complete</span>
            <button
              onClick={() => {
                setAnalysis(null);
                setFile(null);
                setPreview(null);
                setStage("idle");
              }}
              className="ml-auto text-sm text-blue-600 hover:underline"
            >
              Analyze another
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5 border-b border-slate-200 pb-3">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition ${
                  tab === t ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <ResultView tab={tab} analysis={analysis} onCopy={copy} />
        </div>
      )}
    </div>
  );
}

function ResultView({
  tab,
  analysis,
  onCopy,
}: {
  tab: string;
  analysis: AIAnalysis;
  onCopy: (t: string) => void;
}) {
  if (tab === "titles" && analysis.titles?.length) {
    return (
      <div className="space-y-2">
        {analysis.titles.map((t, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between gap-3">
            <p className="font-medium">{t}</p>
            <button onClick={() => onCopy(t)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "description" && analysis.description) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <button
          onClick={() => onCopy(analysis.description!)}
          className="text-sm text-blue-600 mb-3 flex items-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <pre className="whitespace-pre-wrap text-sm font-sans text-slate-700">
          {analysis.description}
        </pre>
      </div>
    );
  }

  if (tab === "seo_tags" && analysis.seo_tags?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          {analysis.seo_tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={() => onCopy(analysis.seo_tags!.join(", "))}
          className="text-sm text-blue-600 flex items-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" /> Copy all
        </button>
      </div>
    );
  }

  if (tab === "hooks" && analysis.hooks?.length) {
    return (
      <div className="space-y-2">
        {analysis.hooks.map((h, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between gap-3">
            <p>{h}</p>
            <button onClick={() => onCopy(h)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "content_analysis" && analysis.content_analysis) {
    const c = analysis.content_analysis as any;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Main topic</h3>
          <p className="text-slate-700">{c.main_topic}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Summary</h3>
          <p className="text-slate-700">{c.summary}</p>
        </div>
        {c.key_points?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-1">Key points</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {c.key_points.map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        {c.improvement_suggestions?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-1">Improvements</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {c.improvement_suggestions.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (tab === "thumbnail_ideas" && analysis.thumbnail_ideas?.length) {
    return (
      <div className="grid gap-3">
        {(analysis.thumbnail_ideas as any[]).map((idea, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="font-semibold mb-2">{idea.concept}</h3>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Text:</span> {idea.suggested_text}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Composition:</span> {idea.visual_composition}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Subject:</span> {idea.main_subject}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "shorts_ideas" && analysis.shorts_ideas?.length) {
    return (
      <div className="grid gap-3">
        {(analysis.shorts_ideas as any[]).map((idea, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="font-semibold">{idea.short_title}</h3>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium">Hook:</span> {idea.hook}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Concept:</span> {idea.concept}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Section:</span> {idea.relevant_section}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "next_video_ideas" && analysis.next_video_ideas?.length) {
    return (
      <div className="space-y-2">
        {analysis.next_video_ideas.map((idea, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between gap-3">
            <p>{idea}</p>
            <button onClick={() => onCopy(idea)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "optimization" && analysis.optimization_suggestions) {
    const o = analysis.optimization_suggestions as any;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        {Object.entries(o).map(([key, items]) => (
          <div key={key}>
            <h3 className="font-semibold mb-1 capitalize">{key.replace(/_/g, " ")}</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {(items as string[])?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-slate-500 text-sm">No data available for this section.</p>;
}
