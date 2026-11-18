/**
 * Servicio Fiscal y de Facturación (Backend)
 * Comercial Perla de Oriente S.A. de C.V.
 * Normativa: IVA 13% y Retención 1% Gran Contribuyente (El Salvador)
 */

export const TAX_CONFIG = {
  IVA_RATE: 0.13,
  RETENTION_RATE: 0.01,
  MIN_RETENTION_BASE: 100.00,
  COMPANY: {
    name: 'Comercial Perla de Oriente S.A. de C.V.',
    tradeName: 'Perla de Oriente — Muebles & Electrodomésticos',
    nit: '0614-230588-102-1',
    nrc: '45892-3',
    giro: 'Venta al por mayor y menor de muebles, artículos y electrodomésticos para el hogar',
    address: 'Av. Roosevelt Sur #402, San Miguel, El Salvador',
    phone: '+503 2661-8900',
    email: 'facturacion@perlaoriente.com.sv',
    branch: 'Casa Matriz San Miguel - Terminal POS 01'
  }
};

export function roundCurrency(num) {
  return Number(Math.round(Number(num + 'e+2')) + 'e-2');
}

export function calculateInvoiceTotals(items, applyRetention = false) {
  let baseGravada = 0;

  const itemDetails = items.map(item => {
    const lineBase = roundCurrency(item.price * item.quantity);
    const lineIva = roundCurrency(lineBase * TAX_CONFIG.IVA_RATE);
    const lineTotal = roundCurrency(lineBase + lineIva);
    baseGravada = roundCurrency(baseGravada + lineBase);

    return {
      ...item,
      lineBase,
      lineIva,
      lineTotal
    };
  });

  const ivaDebito = roundCurrency(baseGravada * TAX_CONFIG.IVA_RATE);
  const subtotalConIva = roundCurrency(baseGravada + ivaDebito);

  const retentionEligible = applyRetention && baseGravada >= TAX_CONFIG.MIN_RETENTION_BASE;
  const retencion1 = retentionEligible ? roundCurrency(baseGravada * TAX_CONFIG.RETENTION_RATE) : 0;
  const totalPagar = roundCurrency(subtotalConIva - retencion1);

  return {
    items: itemDetails,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    baseGravada,
    ivaDebito,
    subtotalConIva,
    applyRetention,
    retentionEligible,
    retencion1,
    totalPagar
  };
}

export function generateVoucherNumber(docType, sequenceNumber) {
  const prefix = docType === 'CCF' ? 'CCF-03' : 'FAC-01';
  const padSeq = String(sequenceNumber).padStart(8, '0');
  return `${prefix}-${padSeq}`;
}

export function generateDTEUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
}

export function validateCustomerData(docType, customer = {}) {
  const errors = [];
  const sanitized = { ...customer };

  if (docType === 'CCF') {
    if (!sanitized.businessName || !sanitized.businessName.trim()) {
      errors.push('La Razón Social o Nombre Comercial es obligatorio para Crédito Fiscal.');
    }
    if (!sanitized.nrc || !sanitized.nrc.trim()) {
      errors.push('El NRC (N° de Registro de Contribuyente) es obligatorio para Crédito Fiscal.');
    }
    if (!sanitized.nit || !sanitized.nit.trim()) {
      errors.push('El NIT o DUI del contribuyente es obligatorio para Crédito Fiscal.');
    }
    if (!sanitized.giro || !sanitized.giro.trim()) {
      errors.push('El Giro comercial o actividad económica es obligatorio para Crédito Fiscal.');
    }
  } else {
    // Factura Consumidor Final
    if (!sanitized.name || !sanitized.name.trim()) {
      sanitized.name = 'Cliente Mostrador / Consumidor Final';
    }
    // Validación estricta de DUI si se proporciona: solo números, 8 o 9 dígitos
    if (sanitized.docNumber && sanitized.docNumber.trim()) {
      const cleanDoc = sanitized.docNumber.replace(/\D/g, '');
      if (cleanDoc.length < 8 || cleanDoc.length > 9) {
        errors.push('El DUI del cliente debe contener exactamente 8 o 9 dígitos numéricos.');
      } else {
        sanitized.docNumber = cleanDoc;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedCustomer: sanitized
  };
}

export function numberToWords(amount) {
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  const centsStr = `${String(decimalPart).padStart(2, '0')}/100 USD`;

  const words = convertIntegerToWords(integerPart);
  return `${words} DÓLARES CON ${centsStr}`.toUpperCase();
}

function convertIntegerToWords(n) {
  if (n === 0) return 'CERO';

  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function readGroup(num) {
    let output = '';
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;

    if (num === 100) return 'CIEN';
    if (h > 0) output += hundreds[h] + ' ';

    if (remainder >= 10 && remainder <= 19) {
      output += teens[remainder - 10];
    } else if (remainder === 20) {
      output += 'VEINTE';
    } else if (remainder > 20 && remainder < 30) {
      output += 'VEINTI' + units[u];
    } else {
      if (t > 2) output += tens[t] + (u > 0 ? ' Y ' : '');
      if (u > 0 && t !== 1) output += units[u];
    }
    return output.trim();
  }

  if (n < 1000) return readGroup(n);
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const thPrefix = thousands === 1 ? 'MIL' : `${readGroup(thousands)} MIL`;
    return rest === 0 ? thPrefix : `${thPrefix} ${readGroup(rest)}`;
  }

  const millions = Math.floor(n / 1000000);
  const restMillions = n % 1000000;
  const mPrefix = millions === 1 ? 'UN MILLÓN' : `${readGroup(millions)} MILLONES`;
  return restMillions === 0 ? mPrefix : `${mPrefix} ${convertIntegerToWords(restMillions)}`;
}

