# Especificación Técnica de la API REST — POS, Facturación & Contabilidad

**Comercial Perla de Oriente S.A. de C.V.**  
*Versión 1.0.0 — Protocolo HTTP/REST — Salida JSON*

---

## 1. Configuración del Servidor

- **Host Base:** `http://localhost:3000/api`
- **Cabeceras globales:**
  - `Content-Type: application/json`
  - `Access-Control-Allow-Origin: *` (CORS Habilitado)

---

## 2. Endpoints de Productos e Inventario

### `GET /api/products`
Obtiene la lista completa de artículos con stock, categoría y precios.

**Respuesta exitosa (`200 OK`):**
```json
[
  {
    "id": "prod-01",
    "code": "MUB-001",
    "name": "Juego de Sala Modular L-Shape \"Milano\"",
    "description": "Tapizado de lino resistente, espuma de alta densidad y estructura de pino curado.",
    "category": "Muebles",
    "price": 749.00,
    "stock": 5,
    "icon": "sofa",
    "warranty": "2 años en estructura de madera"
  }
]
```

### `GET /api/products/:id`
Obtiene los detalles de un producto específico por su ID.

### `POST /api/products/:id/restock`
Aumenta el inventario de un artículo.

**Cuerpo de solicitud (Opcional):**
```json
{
  "delta": 5
}
```

---

## 3. Endpoints de Ventas y Facturación DTE

### `GET /api/sales`
Obtiene el historial cronológico de comprobantes emitidos (Facturas y Créditos Fiscales).

### `GET /api/sales/:id`
Obtiene una venta específica por su identificador.

### `POST /api/sales`
Procesa una transacción de venta de forma atómica:
1. Valida datos fiscales del cliente (según DTE-01 Factura o DTE-03 CCF).
2. Valida disponibilidad de existencias.
3. Descuenta el inventario en bodega.
4. Genera correlativo fiscal y Código de Generación DTE (UUID v4).
5. Genera automáticamente la Partida Contable en Partida Doble (`Debe === Haber`).

**Cuerpo de solicitud (Ejemplo Crédito Fiscal con Gran Contribuyente):**
```json
{
  "docType": "CCF",
  "customer": {
    "businessName": "Distribuidora San Miguel S.A. de C.V.",
    "nrc": "45892-1",
    "nit": "0614-120590-101-3",
    "giro": "Comercialización de Muebles",
    "address": "San Miguel, El Salvador"
  },
  "items": [
    {
      "id": "prod-05",
      "code": "LNB-001",
      "name": "Refrigeradora Inverter 14 Cu.Ft. No Frost Mabe",
      "category": "Línea Blanca",
      "price": 625.00,
      "quantity": 2
    }
  ],
  "applyRetention": true,
  "paymentMethod": "cash"
}
```

**Respuesta exitosa (`201 Created`):**
```json
{
  "sale": {
    "id": "sale-1763500000000",
    "voucherNumber": "CCF-03-00000001",
    "dteUUID": "B987C2D4-3E12-4B6A-9134-A75E4D12F981",
    "docType": "CCF",
    "totals": {
      "baseGravada": 1250.00,
      "ivaDebito": 162.50,
      "subtotalConIva": 1412.50,
      "retencion1": 12.50,
      "totalPagar": 1400.00
    }
  },
  "journalEntry": {
    "entryNumber": 1,
    "isBalanced": true,
    "totalDebit": 1412.50,
    "totalCredit": 1412.50,
    "glosa": "Venta de mercaderías al contado según Comprobante de Crédito Fiscal N° CCF-03-00000001..."
  }
}
```

---

## 4. Endpoints de Contabilidad NIIF

### `GET /api/accounting/journal`
Devuelve todas las partidas de diario y el balance de sumas acumuladas (`totalDebit`, `totalCredit`, `allBalanced`).

### `GET /api/accounting/t-accounts`
Devuelve el Libro Mayor estructurado en **Cuentas "T"**:
- Movimientos del Debe y del Haber.
- Movimiento Deudor y Movimiento Acreedor.
- Saldo Final clasificado (Saldo Deudor vs Saldo Acreedor).

### `GET /api/accounting/f-07`
Genera el cálculo de la Declaración Mensual de IVA (Simulador del Formulario F-07 de la DGII de El Salvador):
- Ventas Gravadas a Consumidores Finales.
- Ventas Gravadas a Contribuyentes.
- Débito Fiscal total (13%).
- Retenciones de IVA soportadas (1%).
- Impuesto neto resultante a pagar.

---

## 5. Mantenimiento y Demo

### `POST /api/reset`
Restaura la base de datos a los valores iniciales de prueba (restablece catálogo y elimina ventas temporales).

