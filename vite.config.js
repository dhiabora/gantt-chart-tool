import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages はリポジトリ配下で配信されることが多いので、相対パスにしてハマりを減らす
  base: './',
})
