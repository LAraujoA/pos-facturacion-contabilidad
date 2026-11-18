/**
 * Servidor API REST y Servidor Estático Integrado
 * Comercial Perla de Oriente S.A. de C.V.
 * Desarrollado con Node.js puro (cero dependencias externas requeridas)
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRoute } from './routes/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // Configuración de encabezados CORS globales
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. Enrutamiento de la API REST (/api/...)
  if (pathname.startsWith('/api')) {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk;
    });

    req.on('end', async () => {
      let parsedBody = null;
      if (rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JSON malformado en cuerpo de solicitud' }));
          return;
        }
      }

      try {
        const response = await handleApiRoute(req, parsedBody);
        res.writeHead(response.status || 200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response.data));
      } catch (err) {
        console.error('Error procesando solicitud API:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error interno del servidor', details: err.message }));
      }
    });
    return;
  }

  // 2. Servir frontend estático de forma opcional (cuando se abre http://localhost:3000)
  try {
    let filePath = pathname === '/' ? path.join(FRONTEND_DIR, 'index.html') : path.join(FRONTEND_DIR, pathname);

    // Seguridad: Prevenir directory traversal
    if (!filePath.startsWith(FRONTEND_DIR)) {
      res.writeHead(403);
      res.end('Acceso denegado');
      return;
    }

    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } catch {
      // Fallback a index.html para SPA routing
      filePath = path.join(FRONTEND_DIR, 'index.html');
    }

    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Recurso no encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 Servidor POS & Facturación - Perla de Oriente`);
  console.log(`📡 API REST:  http://localhost:${PORT}/api`);
  console.log(`💻 Frontend:  http://localhost:${PORT}/`);
  console.log(`=============================================================\n`);
});

