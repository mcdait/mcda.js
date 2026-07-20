import { defineConfig } from "tsdown";

export default defineConfig({
  platform: "neutral",
  entry: "./src/index.ts",
  dts: true,
  format: {
    esm: {
      target: ["es2020"],
    },
    cjs: {
      target: ["node20"],
    },
    iife: {
      target: ["es2015"],
    },
  },
  exports: true,
  publint: {
    level: "suggestion",
  },
  attw: {
    profile: "node16",
    level: "warn",
  },
  globalName: "Mcda",
  outputOptions: {
    globals: {
      mathjs: "math",
    },
  },
});
