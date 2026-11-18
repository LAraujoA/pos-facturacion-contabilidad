/**
 * Cliente API y Capa de Abstracción de Datos
 * Conecta con el Backend RESTful (http://localhost:3000/api)
 * con fallback automático a localStorage en caso de estar offline.
 */

import { INITIAL_PRODUCTS } from './catalog.js';
import { calculateInvoiceTotals, generateVoucherNumber, generateDTEUUID, validateCustomerData } from './billing.js';
import { createJournalEntry, calculateLedgerTotals, generateTAccounts, generateF07Summary } from './accounting.js';

const API_BASE = window.location.hostname ? `${window.location.protocol}//${window.location.hostname}:3000/api` : 'http://localhost:3000/api';

const STORAGE_KEYS = {
  PRODUCTS: 'perla_oriente_products_v1',
  SALES: 'perla_oriente_sales_v1',
  JOURNAL: 'perla_oriente_journal_v1',
  SEQUENCE_FAC: 'perla_oriente_seq_fac_v1',
  SEQUENCE_CCF: 'perla_oriente_seq_ccf_v1'
};

class ApiService {
  constructor() {
    this.isBackendOnline = false;
    this.onStatusChange = null;
  }

  async checkStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${API_BASE}/products`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.isBackendOnline = res.ok;
    } catch {
      this.isBackendOnline = false;
    }

    if (typeof this.onStatusChange === 'function') {
      this.onStatusChange(this.isBackendOnline);
    }
    return this.isBackendOnline;
  }

  // --- PRODUCTOS ---
  async getProducts() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/products`);
        if (res.ok) {
          const products = await res.json();
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
          return products;
        }
      } catch (err) {
        console.warn('Fallo al conectar con backend, usando almacenamiento local:', err);
      }
    }

    // Fallback Local
    const local = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return local ? JSON.parse(local) : [...INITIAL_PRODUCTS];
  }

  async restockProduct(id, delta = 5) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/products/${id}/restock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delta })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Fallback a restock local:', err);
      }
    }

    // Fallback Local
    const products = await this.getProducts();
    const prod = products.find(p => p.id === id);
    if (prod) {
      prod.stock += delta;
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      return prod;
    }
    return null;
  }

  // --- VENTAS Y FACTURACIÓN ---
  async getSales() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/sales`);
        if (res.ok) {
          const sales = await res.json();
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
          return sales;
        }
      } catch (err) {
        console.warn('Fallback de ventas a local:', err);
      }
    }

    const local = localStorage.getItem(STORAGE_KEYS.SALES);
    return local ? JSON.parse(local) : [];
  }

  async createSale(saleData) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData)
        });
        const result = await res.json();
        if (res.ok) {
          return result;
        } else {
          throw new Error(result.error || 'Error al procesar venta en servidor');
        }
      } catch (err) {
        if (!err.message.includes('Error al procesar venta en servidor')) {
          console.warn('Servidor no disponible, procesando venta localmente:', err);
        } else {
          throw err;
        }
      }
    }

    // Fallback Local Completo
    const { docType, customer, items, applyRetention, paymentMethod, creditTerms } = saleData;

    // 1. Validaciones
    const validation = validateCustomerData(docType, customer);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const products = await this.getProducts();
    for (const item of items) {
      const prod = products.find(p => p.id === item.id);
      if (!prod || prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod ? prod.name : item.id}". Disponible: ${prod ? prod.stock : 0}`);
      }
    }

    // 2. Descontar Stock
    items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) prod.stock -= item.quantity;
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // 3. Totales y correlativos
    const totals = calculateInvoiceTotals(items, applyRetention);
    const seqKey = docType === 'CCF' ? STORAGE_KEYS.SEQUENCE_CCF : STORAGE_KEYS.SEQUENCE_FAC;
    const currentSeq = Number(localStorage.getItem(seqKey)) || 1;
    localStorage.setItem(seqKey, String(currentSeq + 1));

    const voucherNumber = generateVoucherNumber(docType, currentSeq);
    const dteUUID = generateDTEUUID();

    const sale = {
      id: `sale-${Date.now()}`,
      voucherNumber,
      dteUUID,
      docType,
      customer: validation.sanitizedCustomer,
      items: totals.items,
      totals,
      paymentMethod,
      creditTerms,
      timestamp: new Date().toISOString()
    };

    const localSales = await this.getSales();
    localSales.unshift(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(localSales));

    // 4. Asiento Contable
    const localJournal = await this.getJournalEntries();
    const entryNumber = localJournal.length + 1;
    const journalEntry = createJournalEntry(sale, entryNumber);
    localJournal.unshift(journalEntry);
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(localJournal));

    return { sale, journalEntry };
  }

  // --- CONTABILIDAD ---
  async getJournalEntries() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/accounting/journal`);
        if (res.ok) {
          const json = await res.json();
          localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(json.entries));
          return json.entries;
        }
      } catch (err) {
        console.warn('Fallback diario a local:', err);
      }
    }

    const local = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    return local ? JSON.parse(local) : [];
  }

  async getTAccounts() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/accounting/t-accounts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Fallback Cuentas T a local:', err);
      }
    }

    const entries = await this.getJournalEntries();
    return generateTAccounts(entries);
  }

  async getF07Summary() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/accounting/f-07`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Fallback F-07 a local:', err);
      }
    }

    const sales = await this.getSales();
    return generateF07Summary(sales);
  }

  async resetDemo() {
    if (this.isBackendOnline) {
      try {
        await fetch(`${API_BASE}/reset`, { method: 'POST' });
      } catch (err) {
        console.warn('Error al resetear en backend:', err);
      }
    }

    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.JOURNAL);
    localStorage.removeItem(STORAGE_KEYS.SEQUENCE_FAC);
    localStorage.removeItem(STORAGE_KEYS.SEQUENCE_CCF);
  }
}

export const api = new ApiService();

