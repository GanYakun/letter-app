import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  build: {
    outDir: 'renderer', // 👈 这样会和 Electron 主进程更兼容
    emptyOutDir: true
  },
  plugins: [
    vue(),
  ],
  server: {
    port: 3000,
    host: 'localhost'  // 或 true（如你在局域网访问）
  }
})