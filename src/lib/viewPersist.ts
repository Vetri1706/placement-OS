import type { View } from "@/store/useAppStore"

export type LastView = {
  view: View
  at: number
}

const STORAGE_KEY = "placementOs:lastView"

function hasAppStore(): boolean {
  const w = window as unknown as { appStore?: { get?: unknown; set?: unknown } }
  return typeof w?.appStore?.get === "function" && typeof w?.appStore?.set === "function"
}

export function saveLastView(view: View) {
  const payload: LastView = { view, at: Date.now() }

  try {
    if (hasAppStore()) {
      ;(window as any).appStore.set(STORAGE_KEY, payload)
      return
    }
  } catch {
    // ignore and fall back
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function loadLastView(): LastView | null {
  try {
    if (hasAppStore()) {
      const v = (window as any).appStore.get(STORAGE_KEY)
      if (v && typeof v === "object" && typeof v.view === "string") {
        return v as LastView
      }
    }
  } catch {
    // ignore and fall back
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && typeof parsed.view === "string") {
      return parsed as LastView
    }
  } catch {
    // ignore
  }

  return null
}
