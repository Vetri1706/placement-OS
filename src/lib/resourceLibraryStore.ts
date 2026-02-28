import type { ResourceAIExplain } from "@/types/resources";

export interface ResourceLibraryState {
  version: 1;
  bookmarkedIds: string[];
  completedIds: string[];
  notesById: Record<string, string>;
  aiById: Record<
    string,
    {
      createdAt: string;
      value: ResourceAIExplain;
    }
  >;
}

const STORAGE_KEY = "resourceLibraryState";

const emptyState = (): ResourceLibraryState => ({
  version: 1,
  bookmarkedIds: [],
  completedIds: [],
  notesById: {},
  aiById: {},
});

let memoryState: ResourceLibraryState | null = null;

function safeJsonParse<T>(raw: unknown): T | null {
  try {
    if (typeof raw === "string") return JSON.parse(raw) as T;
    if (raw && typeof raw === "object") return raw as T;
    return null;
  } catch {
    return null;
  }
}

export async function loadResourceLibraryState(): Promise<ResourceLibraryState> {
  try {
    const stored = typeof window !== "undefined" ? await window.appStore?.get?.(STORAGE_KEY) : null;
    const parsed = safeJsonParse<ResourceLibraryState>(stored);
    if (parsed?.version === 1) return parsed;
  } catch {
    // ignore
  }

  if (memoryState?.version === 1) return memoryState;
  return emptyState();
}

export async function saveResourceLibraryState(state: ResourceLibraryState): Promise<void> {
  memoryState = state;
  try {
    await window.appStore?.set?.(STORAGE_KEY, state);
  } catch {
    // ignore
  }
}
