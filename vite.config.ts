import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 개발 서버가 /api(API) · /uploads(상품 이미지)를 백엔드로 넘긴다.
// 백엔드를 다른 포트로 띄웠으면: API_PROXY_TARGET=http://localhost:8091 npm run dev
const target = process.env.API_PROXY_TARGET ?? 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': target,
      '/uploads': target,
    },
  },
})
