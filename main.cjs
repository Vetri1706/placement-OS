const { app, BrowserWindow } = require("electron")
const path = require("path")
const ElectronStore = require("electron-store")
const Store = ElectronStore.default ?? ElectronStore

Store.initRenderer()

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,

    transparent: true,
    backgroundColor: "#00000000",

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // ⭐ Load built React app
  const indexPath = path.join(__dirname, "dist", "index.html")

  console.log("Loading:", indexPath)

  win.loadFile(indexPath)

  // ⭐ DevTools (remove in production)
  win.webContents.openDevTools()
}

app.whenReady().then(createWindow)