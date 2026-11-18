/**
 * Controlador de Productos e Inventario
 */

import { db } from '../data/database.js';

export async function getProducts(req, res) {
  const products = await db.getProducts();
  return { status: 200, data: products };
}

export async function getProductById(id) {
  const product = await db.getProductById(id);
  if (!product) {
    return { status: 404, data: { error: 'Producto no encontrado' } };
  }
  return { status: 200, data: product };
}

export async function restockProduct(id, delta = 5) {
  const product = await db.incrementProductStock(id, delta);
  if (!product) {
    return { status: 404, data: { error: 'Producto no encontrado' } };
  }
  return { status: 200, data: product };
}

