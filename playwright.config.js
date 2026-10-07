import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 20000,
  workers: 1,
  reporter: "list",
});
