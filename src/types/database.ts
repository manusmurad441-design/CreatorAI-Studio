export type Plan = "free" | "pro";
export type SubscriptionStatus = "active" | "inactive" | "canceled" | "expired";
export type VideoStatus = "uploading" | "uploaded" | "processing" | "analyzing" | "completed" | "failed";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  project_id: string | null;
  filename: string;
  file_url: string;
  file_size: number | null;
  duration: number | null;
  mime_type: string | null;
  status: VideoStatus;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  user_id: string;
  video_id: string;
  titles: string[] | null;
  description: string | null;
  seo_tags: string[] | null;
  hooks: string[] | null;
  content_analysis: ContentAnalysis | null;
  thumbnail_ideas: ThumbnailIdea[] | null;
  shorts_ideas: ShortsIdea[] | null;
  next_video_ideas: string[] | null;
  optimization_suggestions: OptimizationSuggestions | null;
  created_at: string;
}

export interface ContentAnalysis {
  main_topic: string;
  summary: string;
  key_points: string[];
  sections: { title: string; description: string }[];
  improvement_suggestions: string[];
}

export interface ThumbnailIdea {
  concept: string;
  suggested_text: string;
  visual_composition: string;
  main_subject: string;
}

export interface ShortsIdea {
  short_title: string;
  hook: string;
  concept: string;
  relevant_section: string;
}

export interface OptimizationSuggestions {
  title_improvements: string[];
  hook_improvements: string[];
  seo_suggestions: string[];
  structure_suggestions: string[];
  retention_suggestions: string[];
}

export interface SavedResult {
  id: string;
  user_id: string;
  analysis_id: string;
  result_type: string;
  content: any;
  created_at: string;
}

export interface Usage {
  id: string;
  user_id: string;
  action: string;
  credits_used: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  payment_provider: string | null;
  payment_reference: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Free plan: 3 analyses per month
// Pro plan: 50 analyses per month
export const PLAN_LIMITS = {
  free: { monthly_analyses: 3 },
  pro: { monthly_analyses: 50 },
} as const;
