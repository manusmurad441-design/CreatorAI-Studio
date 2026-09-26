"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { History as HistoryIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface AnalysisRow {
  id: string;
  created_at: string;
  video_id: string;
  videos: { filename: string; status: string } | null;
}

export default function HistoryPage() {
  const [items, setItems] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("ai_analyses")
      .select("id, created_at, video_id, videos(filename, status)")
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this analysis?")) return;
    const { error } = await supabase.from("ai_analyses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">History</h1>
      <p className="text-slate-600 mb-8">Your previous video analyses</p>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <HistoryIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No analyses yet</p>
          <Link href="/analyze" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            Analyze a video
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Video</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/history/${item.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {item.videos?.filename || "Untitled"}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 capitalize text-slate-600">
                    {item.videos?.status || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => remove(item.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
