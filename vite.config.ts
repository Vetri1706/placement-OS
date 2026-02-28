import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Electron loads via file:// which doesn't support CORS.
// Strip the crossorigin attribute Vite injects so assets load correctly.
function removeElectronCrossOrigin() {
  return {
    name: "remove-crossorigin",
    transformIndexHtml(html: string) {
      return html.replace(/ crossorigin(?:="[^"]*")?/g, "");
    },
  };
}

export default defineConfig({
  base: "./",

  plugins: [react(), removeElectronCrossOrigin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        "get-started": path.resolve(__dirname, "get-started.html"),
      },
    },
  },
});