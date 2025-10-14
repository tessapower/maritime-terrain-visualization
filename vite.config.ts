import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), glsl()],
  base: "/maritime-terrain-visualization/",
  assetsInclude: ["**/*.glsl"],
});
