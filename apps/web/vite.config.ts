import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: {
        tsconfigPath: 'tsconfig.app.json', // <- не solution, а реальный проект
      },
      eslint: {
        lintCommand: 'eslint "src/**/*.{ts,tsx,js,jsx}"',
        useFlatConfig: true,
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
