import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_API_BASE = 'http://localhost:7071/api';

const ensureApiBaseUrl = (raw?: string) => {
  if (!raw) return DEFAULT_API_BASE;
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = ensureApiBaseUrl(env.VITE_API_BASE_URL);

  return {
    plugins: [react()],
    define: {
      'process.env': {
        API_BASE_URL: apiBaseUrl,
      },
    },
  };
});
