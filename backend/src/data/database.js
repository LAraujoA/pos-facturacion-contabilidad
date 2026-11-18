/**
 * Gestor de Persistencia y Base de Datos (JSON File Store)
 * Comercial Perla de Oriente S.A. de C.V.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'db.json');
const INITIAL_PRODUCTS_FILE = path.join(__dirname, 'initialProducts.json');

class Database {
  constructor() {
    this.data = null;
    this.isLoaded = false;
  }

  async init() {
    if (this.isLoaded) return;
    try {
      const content = await fs.readFile(DB_FILE, 'utf-8');
      this.data = JSON.parse(content);
      this.isLoaded = true;
    } catch {
      await this.reset();
    }
  }

  async reset() {
    const rawInit = await fs.readFile(INITIAL_PRODUCTS_FILE, 'utf-8');
    const products = JSON.parse(rawInit);

    this.data = {
      products,
      sales: [],
      journalEntries: [],
      sequences: {
        FAC: 1,
        CCF: 1
      },
      updatedAt: new Date().toISOString()
    };

    await this.persist();
    this.isLoaded = true;
  }

  async persist() {
    this.data.updatedAt = new Date().toISOString();
    await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  async getProducts() {
    await this.init();
    return this.data.products;
  }

  async getProductById(id) {
    await this.init();
    return this.data.products.find(p => p.id === id);
  }

  async updateProductStock(id, newStock) {
    await this.init();
    const product = this.data.products.find(p => p.id === id);
    if (!product) return null;
    product.stock = newStock;
    await this.persist();
    return product;
  }

  async incrementProductStock(id, delta) {
    await this.init();
    const product = this.data.products.find(p => p.id === id);
    if (!product) return null;
    product.stock += delta;
    await this.persist();
    return product;
  }

  async getSales() {
    await this.init();
    return this.data.sales;
  }

  async getSaleById(id) {
    await this.init();
    return this.data.sales.find(s => s.id === id);
  }

  async addSale(sale) {
    await this.init();
    this.data.sales.unshift(sale);
    await this.persist();
    return sale;
  }

  async getJournalEntries() {
    await this.init();
    return this.data.journalEntries;
  }

  async addJournalEntry(entry) {
    await this.init();
    this.data.journalEntries.unshift(entry);
    await this.persist();
    return entry;
  }

  async getNextSequence(docType) {
    await this.init();
    const current = this.data.sequences[docType] || 1;
    this.data.sequences[docType] = current + 1;
    await this.persist();
    return current;
  }
}

export const db = new Database();

