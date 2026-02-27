export type ResourceType = "video" | "article" | "practice" | "course" | "pdf";

export type ResourceDifficulty = "Beginner" | "Intermediate" | "Advanced" | "All";

export type ResourceSection =
  | "coding-practice"
  | "courses"
  | "interview-prep"
  | "company-specific";

export interface ResourceItem {
  id: string;
  title: string;
  type: ResourceType;
  section: ResourceSection;
  source: string;
  url: string;
  tags: string[];
  difficulty: ResourceDifficulty;
  roles: string[];
  rating?: number;
  durationMinutes?: number;
  image?: string;
  description?: string;
}

export interface ResourceAIExplain {
  summary: string;
  keyPoints: string[];
  questions: string[];
  practiceSuggestions: string[];
  nextSteps: string[];
}
