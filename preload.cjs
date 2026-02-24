const { contextBridge } = require("electron")
const ElectronStore = require("electron-store")
const Store = ElectronStore.default ?? ElectronStore

const store = new Store()

contextBridge.exposeInMainWorld("appStore", {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  has: (key) => store.has(key),
  delete: (key) => store.delete(key)
})