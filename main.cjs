const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
  width: 1400,
  height: 900,
  transparent: true,
  backgroundColor: "#00000000"
});

  // ⭐ ABSOLUTE SAFE PATH
  const indexPath = path.join(__dirname, "dist", "index.html");

  console.log("Loading:", indexPath);

  win.loadFile(indexPath);

  win.webContents.openDevTools(); // debug
}

app.whenReady().then(createWindow);