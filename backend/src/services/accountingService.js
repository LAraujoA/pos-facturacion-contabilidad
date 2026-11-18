/**
 * Servicio Contable (Backend) — Comercial Perla de Oriente S.A. de C.V.
 * Normas Internacionales de Información Financiera (NIIF) y Partida Doble.
 */

import { roundCurrency } from './taxService.js';

export const CHART_OF_ACCOUNTS = {
  CASH: {
    code: '1101',
    name: 'Efectivo y Equivalentes de Efectivo',
    subCode: '110101',
    subName: 'Caja General - Terminal POS 01',
    type: 'ACTIVO',
    normalBalance: 'DEUDOR'
  },
  BANK_CARDS: {
    code: '1101',
    name: 'Efectivo y Equivalentes de Efectivo',
    subCode: '110102',
    subName: 'Bancos / Pasarela de Tarjetas POS',
    type: 'ACTIVO',
    normalBalance: 'DEUDOR'
  },
  RECEIVABLE: {
    code: '1102',
    name: 'Cuentas y Documentos por Cobrar',
    subCode: '110201',
    subName: 'Clientes Nacionales - Crédito Comercial',
    type: 'ACTIVO',
    normalBalance: 'DEUDOR'
  },
  RETENTION_ASSET: {
    code: '1105',
    name: 'Pagos a Cuenta y Retenciones de Impuesto',
    subCode: '110502',
    subName: 'Anticipo IVA Retenido 1% (Gran Contribuyente)',
    type: 'ACTIVO',
    normalBalance: 'DEUDOR'
  },
  IVA_DEBIT: {
    code: '2107',
    name: 'Impuestos por Pagar',
    subCode: '210701',
    subName: 'Débito Fiscal IVA (13%)',
    type: 'PASIVO',
    normalBalance: 'ACREEDOR'
  },
  SALES_REVENUE: {
    code: '5101',
    name: 'Ingresos por Actividades Ordinarias',
    subCode: '510101',
    subName: 'Ventas de Mercaderías (Muebles y Electrodomésticos)',
    type: 'INGRESOS',
    normalBalance: 'ACREEDOR'
  }
};

export function createJournalEntry(sale, entryNumber) {
  const { voucherNumber, docType, totals, customer, timestamp, paymentMethod = 'cash', creditTerms } = sale;
  const rows = [];

  // 1. DEBE: Cuenta deudora según medio de pago
  if (paymentMethod === 'credit') {
    rows.push({
      code: CHART_OF_ACCOUNTS.RECEIVABLE.code,
      accountName: CHART_OF_ACCOUNTS.RECEIVABLE.name,
      subCode: CHART_OF_ACCOUNTS.RECEIVABLE.subCode,
      subName: CHART_OF_ACCOUNTS.RECEIVABLE.subName,
      debit: totals.totalPagar,
      credit: 0.00
    });
  } else if (paymentMethod === 'card') {
    rows.push({
      code: CHART_OF_ACCOUNTS.BANK_CARDS.code,
      accountName: CHART_OF_ACCOUNTS.BANK_CARDS.name,
      subCode: CHART_OF_ACCOUNTS.BANK_CARDS.subCode,
      subName: CHART_OF_ACCOUNTS.BANK_CARDS.subName,
      debit: totals.totalPagar,
      credit: 0.00
    });
  } else {
    rows.push({
      code: CHART_OF_ACCOUNTS.CASH.code,
      accountName: CHART_OF_ACCOUNTS.CASH.name,
      subCode: CHART_OF_ACCOUNTS.CASH.subCode,
      subName: CHART_OF_ACCOUNTS.CASH.subName,
      debit: totals.totalPagar,
      credit: 0.00
    });
  }

  // 2. DEBE: Anticipo retención 1% Gran Contribuyente
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

  // 3. HABER: Ingreso neto por venta de mercaderías
  rows.push({
    code: CHART_OF_ACCOUNTS.SALES_REVENUE.code,
    accountName: CHART_OF_ACCOUNTS.SALES_REVENUE.name,
    subCode: CHART_OF_ACCOUNTS.SALES_REVENUE.subCode,
    subName: CHART_OF_ACCOUNTS.SALES_REVENUE.subName,
    debit: 0.00,
    credit: totals.baseGravada
  });

  // 4. HABER: Débito Fiscal IVA cobrado (13%)
  rows.push({
    code: CHART_OF_ACCOUNTS.IVA_DEBIT.code,
    accountName: CHART_OF_ACCOUNTS.IVA_DEBIT.name,
    subCode: CHART_OF_ACCOUNTS.IVA_DEBIT.subCode,
    subName: CHART_OF_ACCOUNTS.IVA_DEBIT.subName,
    debit: 0.00,
    credit: totals.ivaDebito
  });

  const totalDebit = roundCurrency(rows.reduce((acc, r) => acc + r.debit, 0));
  const totalCredit = roundCurrency(rows.reduce((acc, r) => acc + r.credit, 0));
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.009;

  const docTypeName = docType === 'CCF' ? 'Comprobante de Crédito Fiscal' : 'Factura Consumidor Final';
  const customerLabel = docType === 'CCF' ? customer.businessName : (customer.name || 'Consumidor Final');
  let paymentText = 'al contado en efectivo';
  if (paymentMethod === 'card') paymentText = 'mediante tarjeta de crédito/débito';
  if (paymentMethod === 'credit') paymentText = `a crédito comercial (${creditTerms || 'plazo regular'})`;

  let glosa = `Venta de mercaderías (muebles y electrodomésticos) ${paymentText} según ${docTypeName} N° ${voucherNumber} a favor de "${customerLabel}".`;
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
    paymentMethod,
    rows,
    totalDebit,
    totalCredit,
    isBalanced,
    glosa
  };
}

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

export function generateTAccounts(journalEntries = []) {
  const accountMap = {};

  journalEntries.forEach(entry => {
    entry.rows.forEach(row => {
      const key = row.code;
      if (!accountMap[key]) {
        accountMap[key] = {
          code: row.code,
          name: row.accountName,
          subName: row.subName,
          debits: [],
          credits: [],
          totalDebit: 0,
          totalCredit: 0,
          saldoDeudor: 0,
          saldoAcreedor: 0
        };
      }

      if (row.debit > 0) {
        accountMap[key].debits.push({
          entryNumber: entry.entryNumber,
          voucherNumber: entry.voucherNumber,
          amount: row.debit,
          date: entry.timestamp
        });
        accountMap[key].totalDebit = roundCurrency(accountMap[key].totalDebit + row.debit);
      }

      if (row.credit > 0) {
        accountMap[key].credits.push({
          entryNumber: entry.entryNumber,
          voucherNumber: entry.voucherNumber,
          amount: row.credit,
          date: entry.timestamp
        });
        accountMap[key].totalCredit = roundCurrency(accountMap[key].totalCredit + row.credit);
      }
    });
  });

  const tAccounts = Object.values(accountMap).map(acc => {
    if (acc.totalDebit >= acc.totalCredit) {
      acc.saldoDeudor = roundCurrency(acc.totalDebit - acc.totalCredit);
      acc.saldoAcreedor = 0.00;
    } else {
      acc.saldoAcreedor = roundCurrency(acc.totalCredit - acc.totalDebit);
      acc.saldoDeudor = 0.00;
    }
    return acc;
  });

  tAccounts.sort((a, b) => a.code.localeCompare(b.code));
  return tAccounts;
}

export function generateF07Summary(sales = []) {
  let ventasConsumidorFinal = 0;
  let debitoConsumidorFinal = 0;
  let ventasContribuyentes = 0;
  let debitoContribuyentes = 0;
  let totalRetenciones1 = 0;

  sales.forEach(sale => {
    if (sale.docType === 'CCF') {
      ventasContribuyentes = roundCurrency(ventasContribuyentes + sale.totals.baseGravada);
      debitoContribuyentes = roundCurrency(debitoContribuyentes + sale.totals.ivaDebito);
    } else {
      ventasConsumidorFinal = roundCurrency(ventasConsumidorFinal + sale.totals.baseGravada);
      debitoConsumidorFinal = roundCurrency(debitoConsumidorFinal + sale.totals.ivaDebito);
    }

    if (sale.totals.retencion1 > 0) {
      totalRetenciones1 = roundCurrency(totalRetenciones1 + sale.totals.retencion1);
    }
  });

  const totalVentasGravadas = roundCurrency(ventasConsumidorFinal + ventasContribuyentes);
  const totalDebitoFiscal = roundCurrency(debitoConsumidorFinal + debitoContribuyentes);
  const impuestoNetoAPagar = roundCurrency(Math.max(0, totalDebitoFiscal - totalRetenciones1));

  return {
    ventasConsumidorFinal,
    debitoConsumidorFinal,
    ventasContribuyentes,
    debitoContribuyentes,
    totalVentasGravadas,
    totalDebitoFiscal,
    totalRetenciones1,
    impuestoNetoAPagar
  };
}

