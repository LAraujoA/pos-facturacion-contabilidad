/**
 * Enrutador API REST
 */

import { getProducts, getProductById, restockProduct } from '../controllers/productsController.js';
import { getSales, getSaleById, createSale } from '../controllers/salesController.js';
import { getJournal, getTAccounts, getF07TaxReturn } from '../controllers/accountingController.js';
import { db } from '../data/database.js';

export async function handleApiRoute(req, body) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method.toUpperCase();

  // --- PRODUCTOS ---
  if (method === 'GET' && pathname === '/api/products') {
    return await getProducts();
  }

  const matchProd = pathname.match(/^\/api\/products\/([^/]+)$/);
  if (matchProd) {
    const id = matchProd[1];
    if (method === 'GET') {
      return await getProductById(id);
    }
    if (method === 'POST' && pathname.endsWith('/restock')) {
      // handled below
    }
  }

  const matchRestock = pathname.match(/^\/api\/products\/([^/]+)\/restock$/);
  if (matchRestock && method === 'POST') {
    const id = matchRestock[1];
    const delta = body && body.delta ? Number(body.delta) : 5;
    return await restockProduct(id, delta);
  }

  // --- VENTAS ---
  if (method === 'GET' && pathname === '/api/sales') {
    return await getSales();
  }

  if (method === 'POST' && pathname === '/api/sales') {
    return await createSale(body);
  }

  const matchSale = pathname.match(/^\/api\/sales\/([^/]+)$/);
  if (matchSale && method === 'GET') {
    return await getSaleById(matchSale[1]);
  }

  // --- CONTABILIDAD ---
  if (method === 'GET' && pathname === '/api/accounting/journal') {
    return await getJournal();
  }

  if (method === 'GET' && pathname === '/api/accounting/t-accounts') {
    return await getTAccounts();
  }

  if (method === 'GET' && pathname === '/api/accounting/f-07') {
    return await getF07TaxReturn();
  }

  // --- RESET DEMO ---
  if (method === 'POST' && pathname === '/api/reset') {
    await db.reset();
    return {
      status: 200,
      data: { message: 'Base de datos restaurada a valores iniciales de demostración' }
    };
  }

  return {
    status: 404,
    data: { error: `Ruta no encontrada: ${method} ${pathname}` }
  };
}

