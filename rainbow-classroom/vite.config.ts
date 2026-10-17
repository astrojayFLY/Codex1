import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diaryApi } from './scripts/diary-api.mjs';
export default defineConfig({ plugins: [react(), { name: 'local-diary', configureServer(server) { server.middlewares.use(diaryApi()); }, configurePreviewServer(server) { server.middlewares.use(diaryApi()); } }], build: { sourcemap: false } });
