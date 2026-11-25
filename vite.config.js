import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5171, open: true },
  preview: { port: 6171 },
  build: { target: 'es2022' },
});
