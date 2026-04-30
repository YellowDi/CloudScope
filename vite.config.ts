import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const DEFAULT_API_BASE_URL = 'https://cloudscope.qfoll.com/api';

function normalizeBaseUrl(value?: string) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = normalizeBaseUrl(env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL);

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: apiBaseUrl
      ? {
          proxy: {
            '/api': {
              target: apiBaseUrl,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          },
        }
      : undefined,
  };
});
