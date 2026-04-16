import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // @ = src/
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("http://localhost:3001/api"),
  },
});
