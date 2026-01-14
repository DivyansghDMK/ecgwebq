import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./public/assets"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@sections": path.resolve(__dirname, "./src/sections"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@lib": path.resolve(__dirname, "./src/lib")
    }
  },
  optimizeDeps: {
    exclude: ['jsonwebtoken'] // Exclude jsonwebtoken from optimization since it's not installed
  },
  server: {
    port: 5173,
    open: true
  }
});

