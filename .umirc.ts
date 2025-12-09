import { defineConfig } from "umi";
export default defineConfig({
  routes: [
    { path: "/", component: "@/pages/index" ,redirect: "/docs"},
    { path: "/docs", component: "@/pages/docs" },
  ],
  history: {
    type: 'hash',
  },
  hash: true,
  npmClient: 'pnpm',
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  outputPath: 'dist',
  favicons: ['/favicon.png'],
});
