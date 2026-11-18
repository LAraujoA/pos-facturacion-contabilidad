/**
 * Motor Contable — Comercial Perla de Oriente S.A. de C.V.
 * Generación de Partidas de Diario en Partida Doble, Cuentas T (Mayorización)
 * y Liquidación Fiscal F-07 conforme a NIIF para PYMES y Código Tributario.
 */

import { roundCurrency } from './billing.js';

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

/**
 * Genera la partida de diario contable a partir de una venta realizada.
 * Valida rigurosamente la partida doble: Suma Debe === Suma Haber.
 */
export function createJournalEntry(sale, entryNumber) {
  const { voucherNumber, docType, totals, customer, timestamp, paymentMethod = 'cash', creditTerms } = sale;
  const rows = [];

  // 1. DEBE: Determinación de la cuenta deudora según forma de pago
  if (paymentMethod === 'credit') {
    // Venta a crédito: Cuentas por cobrar
    rows.push({
      code: CHART_OF_ACCOUNTS.RECEIVABLE.code,
      accountName: CHART_OF_ACCOUNTS.RECEIVABLE.name,
      subCode: CHART_OF_ACCOUNTS.RECEIVABLE.subCode,
      subName: CHART_OF_ACCOUNTS.RECEIVABLE.subName,
      debit: totals.totalPagar,
      credit: 0.00
    });
  } else if (paymentMethod === 'card') {
    // Venta con tarjeta débito/crédito
    rows.push({
      code: CHART_OF_ACCOUNTS.BANK_CARDS.code,
      accountName: CHART_OF_ACCOUNTS.BANK_CARDS.name,
      subCode: CHART_OF_ACCOUNTS.BANK_CARDS.subCode,
      subName: CHART_OF_ACCOUNTS.BANK_CARDS.subName,
      debit: totals.totalPagar,
      credit: 0.00
    });
  } else {
    // Venta en efectivo (Caja General)
    rows.push({
      code: CHART_OF_ACCOUNTS.CASH.code,
      accountName: CHART_OF_ACCOUNTS.CASH.name,
      subCode: CHART_OF_ACCOUNTS.CASH.subCode,
      subName: CHART_OF_ACCOUNTS.CASH.subName,
      debit: totals.totalPagar,
      credit: 0.00
    });
  }

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

/**
 * Genera el Libro Mayor estructurado en Cuentas "T" a partir de todos los asientos del Libro Diario.
 * Permite a estudiantes y docentes visualizar la mayorización con sus saldos deudores o acreedores.
 */
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

  // Determinar saldos finales de cada Cuenta T
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

  // Ordenar por código contable
  tAccounts.sort((a, b) => a.code.localeCompare(b.code));

  return tAccounts;
}

/**
 * Genera el Resumen de Liquidación Tributaria de IVA (Simulador de Formulario F-07 de El Salvador)
 */
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
