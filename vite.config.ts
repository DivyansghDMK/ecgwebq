import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
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
      exclude: ['jsonwebtoken']
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        "/__admin_auth": {
          target: env.VITE_ADMIN_AUTH_BASE_URL || env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) => requestPath.replace(/^\/__admin_auth/, ""),
        },
        "/__admin_api": {
          target: "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod",
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) => requestPath.replace(/^\/__admin_api/, ""),
        },
        "/__doctor_api": {
          target: env.VITE_DOCTOR_API_BASE_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) => requestPath.replace(/^\/__doctor_api/, ""),
        },
      }
    }
  };
});

