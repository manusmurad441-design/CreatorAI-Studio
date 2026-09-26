"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "lucide-react";

export default function SavedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("saved_results")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Saved Results</h1>
      <p className="text-slate-600 mb-8">Results you have saved for later</p>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No saved results yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Use the Save button on any analysis result
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span className="capitalize font-medium text-slate-700">{item.result_type}</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans text-slate-700">
                {typeof item.content === "string"
                  ? item.content
                  : JSON.stringify(item.content, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
