import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const videoId = formData.get("videoId") as string;
    const filePath = formData.get("filePath") as string;
    const filename = formData.get("filename") as string;
    const mimeType = formData.get("mimeType") as string;

    if (!videoId || !filePath) {
      return NextResponse.json({ error: "Missing videoId or filePath" }, { status: 400 });
    }

    // Verify ownership
    const { data: video, error: videoErr } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .single();

    if (videoErr || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check usage limits again (server-side)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

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
      .gte("created_at", startOfMonth.toISOString());

    const limit = isPro ? 50 : 3;
    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: isPro ? "Pro plan monthly limit reached" : "Free plan limit reached (3/month). Upgrade to Pro." },
        { status: 403 }
      );
    }

    // Update video status
    await supabase
      .from("videos")
      .update({ status: "analyzing" })
      .eq("id", videoId);

    // Download video from storage for Gemini
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("videos")
      .download(filePath);

    if (downloadErr || !fileData) {
      await supabase.from("videos").update({ status: "failed" }).eq("id", videoId);
      return NextResponse.json({ error: "Failed to download video from storage" }, { status: 500 });
    }

    // Convert to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // Use Gemini 1.5 Flash / 2.0 Flash for multimodal video analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert YouTube content strategist and SEO specialist.
Analyze this video thoroughly and return a JSON object with the following exact structure (no markdown, just pure JSON):

{
  "titles": ["title1", "title2", "title3", "title4", "title5"],
  "description": "A complete, engaging YouTube description with timestamps if possible, call to action, and hashtags",
  "seo_tags": ["tag1", "tag2", ... up to 15 relevant tags],
  "hooks": ["hook1", "hook2", "hook3", "hook4"],
  "content_analysis": {
    "main_topic": "...",
    "summary": "2-3 sentence summary",
    "key_points": ["point1", "point2", ...],
    "sections": [{"title": "...", "description": "..."}],
    "improvement_suggestions": ["suggestion1", ...]
  },
  "thumbnail_ideas": [
    {
      "concept": "...",
      "suggested_text": "...",
      "visual_composition": "...",
      "main_subject": "..."
    }
  ],
  "shorts_ideas": [
    {
      "short_title": "...",
      "hook": "...",
      "concept": "...",
      "relevant_section": "..."
    }
  ],
  "next_video_ideas": ["idea1", "idea2", "idea3", "idea4"],
  "optimization_suggestions": {
    "title_improvements": ["..."],
    "hook_improvements": ["..."],
    "seo_suggestions": ["..."],
    "structure_suggestions": ["..."],
    "retention_suggestions": ["..."]
  }
}

Base everything on the ACTUAL content of the uploaded video. Be specific, creative, and useful for a creator. Filename was: ${filename}`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "video/mp4",
          data: base64,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    // Parse JSON (handle possible markdown fencing)
    let parsed: any;
    try {
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: try to extract JSON
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Save analysis
    const { data: analysis, error: analysisErr } = await supabase
      .from("ai_analyses")
      .insert({
        user_id: user.id,
        video_id: videoId,
        titles: parsed.titles || [],
        description: parsed.description || "",
        seo_tags: parsed.seo_tags || [],
        hooks: parsed.hooks || [],
        content_analysis: parsed.content_analysis || {},
        thumbnail_ideas: parsed.thumbnail_ideas || [],
        shorts_ideas: parsed.shorts_ideas || [],
        next_video_ideas: parsed.next_video_ideas || [],
        optimization_suggestions: parsed.optimization_suggestions || {},
      })
      .select()
      .single();

    if (analysisErr) {
      console.error(analysisErr);
      await supabase.from("videos").update({ status: "failed" }).eq("id", videoId);
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    // Record usage
    await supabase.from("usage").insert({
      user_id: user.id,
      action: "analysis",
      credits_used: 1,
    });

    // Update video status
    await supabase.from("videos").update({ status: "completed" }).eq("id", videoId);

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      { error: err.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
