import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets work with relative paths on Hostinger
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});