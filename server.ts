import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { exportDatabaseSqlFile, getMySqlPool, isMySqlConfigured, logDatabaseError } from './server/db';
import apiRouter from './server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json());

  // 1. Initialize Aiven MySQL connection exclusively
  console.log('🔌 Connecting exclusively to Aiven Cloud MySQL (defaultdb)...');
  getMySqlPool().then((pool) => {
    if (pool) {
      console.log('🚀 Aiven Cloud MySQL is connected and operational.');
    }
  }).catch((err) => {
    console.error('⚠️ Aiven MySQL connection issue:', err?.message || err);
  });

  // 3. Mount all Backend API Routes under /api
  app.use('/api', apiRouter);

  // 4. Vite middleware for frontend (src/) development vs production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Routine App Server running on http://localhost:${PORT}`);
    console.log(`📦 Backend API mounted at /api`);
    console.log(`🎨 Frontend UI served from /src`);
  });
}

startServer();
