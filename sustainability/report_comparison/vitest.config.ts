import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // The category registry is .tsx (hero copy carries markup), and the data
  // tests import it. Use the automatic JSX runtime so no React import is
  // needed at module scope, matching how Next compiles the app.
  esbuild: { jsx: "automatic" },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
