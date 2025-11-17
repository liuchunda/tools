import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  history: {
    type: 'hash',
  },
  hash: true,
  npmClient: 'pnpm',
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  outputPath: 'dist',
});
