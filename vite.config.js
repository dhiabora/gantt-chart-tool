import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages のリポジトリ名に合わせた公開パス
  base: '/gantt-chart-tool/',
})
