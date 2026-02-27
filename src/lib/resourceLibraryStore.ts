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

function hasElectronStore(): boolean {
  return typeof window !== "undefined" && typeof window.appStore?.get === "function" && typeof window.appStore?.set === "function";
}

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
    if (hasElectronStore()) {
      const stored = await window.appStore.get(STORAGE_KEY);
      const parsed = safeJsonParse<ResourceLibraryState>(stored);
      if (parsed?.version === 1) return parsed;
      return emptyState();
    }

    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const parsed = safeJsonParse<ResourceLibraryState>(raw);
    if (parsed?.version === 1) return parsed;
    return emptyState();
  } catch {
    return emptyState();
  }
}

export async function saveResourceLibraryState(state: ResourceLibraryState): Promise<void> {
  try {
    if (hasElectronStore()) {
      await window.appStore.set(STORAGE_KEY, state);
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore persistence failures
  }
}
