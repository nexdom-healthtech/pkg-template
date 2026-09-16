import path from "path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  run: {
    tasks: {
      docs: {
        command: "vpr docs:dev",
        dependsOn: ["build"],
        cache: false,
      },
      "docs:build": {
        command: "vpx vitepress build docs",
        dependsOn: ["build"],
      },
      "docs:preview": {
        command: "vpx vitepress preview docs",
        dependsOn: ["docs:build"],
      },
      sonar: {
        command: "vpx sonar-scanner",
      },
    },
  },
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    clearMocks: true,
    environment: "jsdom",
    coverage: {
      reporter: process.env.CI ? ["text", "lcov"] : ["text", "html"],
      thresholds: {
        "100": true,
      },
    },
    setupFiles: ["src/__tests__/setup.ts"],
  },
});
