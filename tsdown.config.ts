import { defineConfig } from "tsdown";

export default defineConfig({
  platform: "neutral",
  entry: "./src/index.ts",
  dts: true,
  format: ["esm", "cjs"],
  exports: true,
  publint: {
    level: "suggestion",
  },
  attw: {
    profile: "node16",
    level: "warn",
  },
});
