export {}

declare global {
  interface Window {
    appStore: {
      get: (key: string) => any
      set: (key: string, value: any) => void
      has: (key: string) => boolean
      delete: (key: string) => void
    }
  }
}