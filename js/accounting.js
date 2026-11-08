/**
 * Motor Contable — Comercial Perla de Oriente S.A. de C.V.
 * Generación de Partidas de Diario en Partida Doble según Catálogo de Cuentas y NIIF.
 */

import { roundCurrency } from './billing.js';

export const CHART_OF_ACCOUNTS = {
  CASH: {
    code: '1101',
    name: 'Efectivo y Equivalentes de Efectivo',
    subCode: '110101',
    subName: 'Caja General - Terminal POS 01',
    type: 'ACTIVO'
  },
  RETENTION_ASSET: {
    code: '1105',
    name: 'Pagos a Cuenta y Retenciones de Impuesto',
    subCode: '110502',
    subName: 'Anticipo IVA Retenido 1% (Gran Contribuyente)',
    type: 'ACTIVO'
  },
  IVA_DEBIT: {
    code: '2107',
    name: 'Impuestos por Pagar',
    subCode: '210701',
    subName: 'Débito Fiscal IVA (13%)',
    type: 'PASIVO'
  },
  SALES_REVENUE: {
    code: '5101',
    name: 'Ingresos por Actividades Ordinarias',
    subCode: '510101',
    subName: 'Ventas de Mercaderías (Muebles y Electrodomésticos)',
    type: 'INGRESOS'
  }
};

/**
 * Genera la partida de diario contable a partir de una venta realizada.
 * Valida rigurosamente la partida doble: Suma Debe === Suma Haber.
 */
export function createJournalEntry(sale, entryNumber) {
  const { voucherNumber, docType, totals, customer, timestamp } = sale;
  const rows = [];

  // 1. DEBE: Efectivo ingresado en Caja General
  rows.push({
    code: CHART_OF_ACCOUNTS.CASH.code,
    accountName: CHART_OF_ACCOUNTS.CASH.name,
    subCode: CHART_OF_ACCOUNTS.CASH.subCode,
    subName: CHART_OF_ACCOUNTS.CASH.subName,
    debit: totals.totalPagar,
    credit: 0.00
  });

  // 2. DEBE: Si hubo retención del 1% por Gran Contribuyente, se registra como Activo (Anticipo de Impuesto)
  if (totals.retencion1 > 0) {
    rows.push({
      code: CHART_OF_ACCOUNTS.RETENTION_ASSET.code,
      accountName: CHART_OF_ACCOUNTS.RETENTION_ASSET.name,
      subCode: CHART_OF_ACCOUNTS.RETENTION_ASSET.subCode,
      subName: CHART_OF_ACCOUNTS.RETENTION_ASSET.subName,
      debit: totals.retencion1,
      credit: 0.00
    });
  }

  // 3. HABER: Ingreso neto por venta de mercadería (Base gravada)
  rows.push({
    code: CHART_OF_ACCOUNTS.SALES_REVENUE.code,
    accountName: CHART_OF_ACCOUNTS.SALES_REVENUE.name,
    subCode: CHART_OF_ACCOUNTS.SALES_REVENUE.subCode,
    subName: CHART_OF_ACCOUNTS.SALES_REVENUE.subName,
    debit: 0.00,
    credit: totals.baseGravada
  });

  // 4. HABER: Pasivo de Débito Fiscal IVA cobrado al cliente (13%)
  rows.push({
    code: CHART_OF_ACCOUNTS.IVA_DEBIT.code,
    accountName: CHART_OF_ACCOUNTS.IVA_DEBIT.name,
    subCode: CHART_OF_ACCOUNTS.IVA_DEBIT.subCode,
    subName: CHART_OF_ACCOUNTS.IVA_DEBIT.subName,
    debit: 0.00,
    credit: totals.ivaDebito
  });

  // Cálculo y validación de sumas iguales
  const totalDebit = roundCurrency(rows.reduce((acc, r) => acc + r.debit, 0));
  const totalCredit = roundCurrency(rows.reduce((acc, r) => acc + r.credit, 0));
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.009;

  // Elaboración de la glosa contable profesional
  const docTypeName = docType === 'CCF' ? 'Comprobante de Crédito Fiscal' : 'Factura Consumidor Final';
  const customerLabel = docType === 'CCF' ? customer.businessName : (customer.name || 'Consumidor Final');
  let glosa = `Venta de mercaderías (muebles y electrodomésticos) al contado según ${docTypeName} N° ${voucherNumber} a favor de "${customerLabel}".`;
  if (totals.retencion1 > 0) {
    glosa += ` Incluye retención del 1% de IVA por calificación de Gran Contribuyente.`;
  }

  return {
    id: `entry-${entryNumber}-${Date.now()}`,
    entryNumber,
    timestamp: timestamp || new Date().toISOString(),
    voucherNumber,
    docType,
    customerLabel,
    rows,
    totalDebit,
    totalCredit,
    isBalanced,
    glosa
  };
}

/**
 * Calcula el resumen acumulado del Libro Diario (Balance de Comprobación rápido)
 */
export function calculateLedgerTotals(journalEntries = []) {
  let accumulatedDebit = 0;
  let accumulatedCredit = 0;
  let balancedCount = 0;

  journalEntries.forEach(entry => {
    accumulatedDebit = roundCurrency(accumulatedDebit + entry.totalDebit);
    accumulatedCredit = roundCurrency(accumulatedCredit + entry.totalCredit);
    if (entry.isBalanced) balancedCount++;
  });

  return {
    entryCount: journalEntries.length,
    accumulatedDebit,
    accumulatedCredit,
    allBalanced: journalEntries.length === balancedCount,
    difference: roundCurrency(accumulatedDebit - accumulatedCredit)
  };
}

