import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api.ts';
import { initStorage, checkStorageWritable } from './server/storage.ts';
import { batchStore } from './server/batchStore.ts';
import { CONFIG } from './server/config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = CONFIG.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Initialise and purge storage on startup (M6)
  initStorage();
  console.log(`[Pixora] Initialised storage at ${CONFIG.STORAGE_DIR}`);

  // Clean any orphaned folders in storage root on startup
  try {
    if (fs.existsSync(CONFIG.STORAGE_DIR)) {
      const entries = fs.readdirSync(CONFIG.STORAGE_DIR);
      for (const entry of entries) {
        const full = path.join(CONFIG.STORAGE_DIR, entry);
        if (fs.statSync(full).isDirectory()) {
          fs.rmSync(full, { recursive: true, force: true });
        }
      }
    }
  } catch (err) {
    console.warn('[Pixora] Startup purge warning:', err);
  }

  // 2. Mount API routers
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // 3. Mount Frontend
  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('[Pixora] Production dist folder not found, falling back to Vite dev server');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  } else {
    // Mount Vite dev server middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pixora] Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling (M7)
  const shutdown = () => {
    console.log('[Pixora] Gracefully shutting down...');
    batchStore.stopSweeper();
    batchStore.purgeAll();
    server.close(() => {
      console.log('[Pixora] Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Pixora] Failed to start server:', err);
  process.exit(1);
});
