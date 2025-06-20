import vite from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default vite.defineConfig({
  plugins: [react(), tailwindcss()],
});
