import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

const ERGAST_BASE = 'https://ergast.com/api/f1';
const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

function f1ApiProxy(): Plugin {
  return {
    name: 'f1-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/f1', async (req, res) => {
        try {
          const urlPath = req.url ?? '/';
          const targets = [`${ERGAST_BASE}${urlPath}`, `${JOLPICA_BASE}${urlPath}`];

          let lastErr: unknown = null;
          for (const target of targets) {
            try {
              const upstream = await fetch(target, { headers: { accept: 'application/json' } });
              if (!upstream.ok) {
                lastErr = new Error(`Upstream HTTP ${upstream.status} ${upstream.statusText}`);
                continue;
              }

              const body = Buffer.from(await upstream.arrayBuffer());
              res.statusCode = 200;
              res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json');
              res.setHeader('cache-control', 'no-store');
              res.end(body);
              return;
            } catch (e) {
              lastErr = e;
              continue;
            }
          }

          res.statusCode = 502;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'F1 API proxy failed', detail: String((lastErr as any)?.message ?? lastErr) }));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'Proxy error', detail: String((e as any)?.message ?? e) }));
        }
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [f1ApiProxy(), react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      fs: {
        // Avoid /@fs 404s on Windows path resolution quirks
        allow: [path.resolve(__dirname)],
      },
    },
  };
});
