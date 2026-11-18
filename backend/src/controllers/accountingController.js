/**
 * Controlador de Contabilidad y Reportes Financieros
 */

import { db } from '../data/database.js';
import {
  calculateLedgerTotals,
  generateTAccounts,
  generateF07Summary
} from '../services/accountingService.js';

export async function getJournal() {
  const entries = await db.getJournalEntries();
  const summary = calculateLedgerTotals(entries);
  return {
    status: 200,
    data: {
      entries,
      summary
    }
  };
}

export async function getTAccounts() {
  const entries = await db.getJournalEntries();
  const tAccounts = generateTAccounts(entries);
  return {
    status: 200,
    data: tAccounts
  };
}

export async function getF07TaxReturn() {
  const sales = await db.getSales();
  const summary = generateF07Summary(sales);
  return {
    status: 200,
    data: summary
  };
}

