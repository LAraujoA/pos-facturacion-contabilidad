/**
 * Controlador de Ventas y Facturación
 */

import { db } from '../data/database.js';
import {
  calculateInvoiceTotals,
  generateVoucherNumber,
  generateDTEUUID,
  validateCustomerData
} from '../services/taxService.js';
import { createJournalEntry } from '../services/accountingService.js';

export async function getSales() {
  const sales = await db.getSales();
  return { status: 200, data: sales };
}

export async function getSaleById(id) {
  const sale = await db.getSaleById(id);
  if (!sale) {
    return { status: 404, data: { error: 'Comprobante de venta no encontrado' } };
  }
  return { status: 200, data: sale };
}

export async function createSale(body) {
  const { docType = 'FAC', customer = {}, items = [], applyRetention = false, paymentMethod = 'cash', creditTerms } = body;

  if (!items || items.length === 0) {
    return { status: 400, data: { error: 'El ticket de venta no contiene artículos' } };
  }

  // 1. Validar datos fiscales del cliente
  const validation = validateCustomerData(docType, customer);
  if (!validation.isValid) {
    return { status: 400, data: { error: validation.errors[0], errors: validation.errors } };
  }

  // 2. Validar stock en base de datos
  const products = await db.getProducts();
  for (const item of items) {
    const prod = products.find(p => p.id === item.id);
    if (!prod) {
      return { status: 404, data: { error: `Producto "${item.name || item.id}" no encontrado en catálogo` } };
    }
    if (prod.stock < item.quantity) {
      return { status: 400, data: { error: `Stock insuficiente para "${prod.name}". Disponible: ${prod.stock}` } };
    }
  }

  // 3. Descontar stock
  for (const item of items) {
    await db.incrementProductStock(item.id, -item.quantity);
  }

  // 4. Calcular totales fiscales
  const totals = calculateInvoiceTotals(items, applyRetention);

  // 5. Correlativo y códigos DTE
  const seqNumber = await db.getNextSequence(docType);
  const voucherNumber = generateVoucherNumber(docType, seqNumber);
  const dteUUID = generateDTEUUID();

  // 6. Crear venta
  const sale = {
    id: `sale-${Date.now()}`,
    voucherNumber,
    dteUUID,
    docType,
    customer: validation.sanitizedCustomer,
    items: totals.items,
    totals,
    paymentMethod,
    creditTerms: paymentMethod === 'credit' ? (creditTerms || 'Plazo comercial 12 meses') : null,
    timestamp: new Date().toISOString()
  };
  await db.addSale(sale);

  // 7. Generar Asiento Contable (Libro Diario)
  const currentEntries = await db.getJournalEntries();
  const entryNumber = currentEntries.length + 1;
  const journalEntry = createJournalEntry(sale, entryNumber);
  await db.addJournalEntry(journalEntry);

  return {
    status: 201,
    data: {
      sale,
      journalEntry
    }
  };
}

