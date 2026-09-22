import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173 },
  build: {
    target: "es2020",
    sourcemap: false,
    // Note: manual vendor chunk splitting was removed here — it broke React's
    // module initialization order (React loaded after react-dom, causing
    // "Cannot read properties of undefined (reading 'useState')"). Vite's
    // default chunking is safe; don't reintroduce manualChunks without
    // testing a full production build afterward.
  },
});
