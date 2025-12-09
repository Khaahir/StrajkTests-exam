// vite.config.js (eller vite.config.ts)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Gör att funktioner som 'test', 'expect' är globalt tillgängliga
    environment: 'jsdom', // Använd jsdom för att simulera webbläsarmiljön
    setupFiles: ['./src/setupTests.js'], // Kör denna fil innan testerna
    // Ställ in sökvägar för testfiler
    include: ['**/*.test.jsx', '**/*.test.js'],
  },
});