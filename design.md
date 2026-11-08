# Sistema de Diseño e Identidad Visual — POS Perla de Oriente

Este documento define las pautas visuales, la paleta cromática y las reglas de diseño de interfaz (UI/UX) para el sistema `pos-facturacion-contable` de la empresa **Comercial Perla de Oriente** (Muebles y Electrodomésticos).

---

## 1. Identidad de Marca y Concepto

- **Nombre Comercial:** Perla de Oriente S.A. de C.V.
- **Rubro:** Venta de Muebles, Electrodomésticos y Artículos para el Hogar.
- **Personalidad Visual:** Confiable, corporativa, limpia y moderna. Combina tonos azul marino profundos (solidez y seriedad contable) con acentos dorados y arena perlada (calidez de hogar y referencia al sol/perla oriental).

---

## 2. Paleta de Colores

### Colores Principales (Brand Colors)
- **Azul Corporativo / Navy Principal:** `#0F3C6E` (Equivalente Tailwind: `sky-900` / `blue-900` ajustado)
  - Uso: Navbar, encabezados principales, botones primarios (confirmar venta, emitir factura), bordes destacados.
- **Azul Marino Oscuro (Texto y Estructura):** `#0A2544`
  - Uso: Textos con énfasis, títulos H1/H2, fondos de la barra lateral (sidebar).
- **Dorado / Ocre Solar (Acento):** `#C89D52` (Equivalente Tailwind: `amber-600` / `yellow-600`)
  - Uso: Badges de estado, totales destacados, iconos de atención, llamadas a la acción secundarias, acentos en gráficos contables.
- **Perla / Arena Suave (Secundario/Highlight):** `#EADCC1`
  - Uso: Fondos de tarjetas seleccionadas, pills informativas, bordes suaves de separación.

### Colores Neutros y de Fondo
- **Fondo General (Canvas):** `#F8FAFC` (`slate-50`)
- **Superficie de Tarjetas (Cards):** `#FFFFFF` (`white`)
- **Bordes y Divisores:** `#E2E8F0` (`slate-200`)
- **Texto Principal (Body):** `#1E293B` (`slate-800`)
- **Texto Secundario / Labels:** `#64748B` (`slate-500`)

### Colores de Estado (Feedback Contable)
- **Éxito (Cuadrado / Venta Registrada):** `#059669` (`emerald-600`)
- **Alerta / IVA Débito:** `#D97706` (`amber-600`)
- **Error / Eliminar Ítem:** `#E11D48` (`rose-600`)

---

## 3. Configuración para Tailwind CSS (`tailwind.config.js` o extensión de clases)

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F3C6E',
          dark: '#0A2544',
          gold: '#C89D52',
          pearl: '#EADCC1',
          pearlLight: '#FDFBF7'
        }
      }
    }
  }
}
```

---

## 4. Tipografía y Jerarquía Visual

### Fuentes Recomendadas
- **Fuente Principal de Interfaz (UI & Controles):** `Inter` o `Plus Jakarta Sans`
  - Limpia, altamente legible en pantallas de 15" táctiles o monitores de mostrador.
  - Pesos recomendados: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold).
- **Fuente Numérica y Moneda (Facturas, Balances, Totales y Códigos de Barras):** `JetBrains Mono` o `Roboto Mono`
  - Tabular figures (ancho fijo por dígito) para asegurar que los decimales y columnas de precios en tickets y balances contables alineen con precisión matemática.

### Escala Tipográfica (Escala Rem / Tailwind)
| Elemento | Tamaño / Peso | Uso |
| :--- | :--- | :--- |
| **H1 - Títulos de Módulo** | `24px` / Bold (`text-2xl font-bold`) | Encabezados de pantallas (POS, Facturación, Libro Diario). |
| **H2 - Subtítulos / Secciones** | `18px` / SemiBold (`text-lg font-semibold`) | Encabezados de tarjetas, paneles de cliente y categorías. |
| **Total a Cobrar (Hero Price)** | `32px` - `40px` / ExtraBold (`text-4xl font-extrabold font-mono`) | Total general del carrito en el POS y modal de cobro. |
| **Texto Base (Body)** | `14px` / Regular (`text-sm font-normal`) | Tablas de productos, descripciones de muebles y líneas de factura. |
| **Labels & Metadatos** | `12px` / Medium (`text-xs font-medium uppercase tracking-wider`) | Etiquetas de inputs, SKU, número de serie, IVA desglosado. |
| **Pie de Ticket / Legal** | `10px` - `11px` / Regular (`text-[11px]`) | Resoluciones de DTE / Hacienda, número de autorización fiscal. |

---

## 5. Arquitectura de Pantallas y Componentes Clave

### A. Barra Superior Global (Header del Sistema)
- **Logotipo y Sucursal:** Logotipo de *Perla de Oriente*, indicador de sucursal activa (ej. *Sucursal Central San Miguel*) y número de caja/terminal.
- **Estado de Turno / Caja:** Badge pill indicador con color:
  - `Verde (#059669)`: Caja Abierta / Conectada con DTE / Hacienda.
  - `Ámbar (#D97706)`: Modo Offline / Pendiente de Sincronización.
  - `Gris`: Caja Cerrada.
- **Atajos Globales Rápidos:** Botón de Búsqueda rápida (`Ctrl + K`), Consulta de Existencias en Otras Sucursales (`F3`), Apertura/Cierre de Turno (`F8`).
- **Perfil de Usuario:** Avatar, nombre del cajero/vendedor y rol (`Cajero`, `Supervisor`, `Contador`).

### B. Módulo de Venta POS (Diseño a 2 Columnas)

#### 1. Panel Izquierdo: Catálogo y Búsqueda de Productos (65% del ancho)
- **Barra de Búsqueda Omnibox:** Input prominente con auto-focus constante. Acepta escaneo de código de barras láser, SKU, serie o texto libre del artículo (ej. *Comedor 6 sillas caoba*, *Refrigeradora 16 pies inverter*).
- **Filtros por Categoría (Chips Horizontales):**
  - Muebles de Sala, Muebles de Comedor, Dormitorio, Línea Blanca, Electrodomésticos Menores, Audio/Video.
- **Grilla de Artículos (Cards de Producto):**
  - Imagen del artículo en proporción 4:3 con fondo limpio.
  - Nombre del producto en 2 líneas máximo con tooltip.
  - Badges informativos: Stock disponible (ej. `Disp: 4 unid.`), opción de entrega inmediata o despacho a domicilio.
  - Precio visible con IVA incluido en tipografía monoespaciada destacada.

#### 2. Panel Derecho: Carrito de Venta y Ticket en Vivo (35% del ancho)
- **Selector de Cliente:**
  - Búsqueda por DUI / NIT / NRC / Nombre.
  - Opción rápida para "Cliente Final / Venta Mostrador".
  - Indicador de límite de crédito si es cliente con cuenta corriente.
- **Tabla de Ítems Agregados:**
  - Fila por producto: Cantidad editable (+/- táctil o teclado), descripción, precio unitario, descuento aplicado, total de línea.
  - Botón de remover con confirmación rápida (`Delete` o icono de papelera).
- **Resumen Financiero (Panel Inferior Fijo):**
  - Subtotal neto: `$0.00`
  - Descuentos: `-$0.00`
  - IVA (13%): `$0.00`
  - **TOTAL A PAGAR:** Caja destacada con fondo `brand-navy` y texto en `brand-gold` o blanco de alto contraste.
- **Barra de Acciones Principales:**
  - `[F12]` **Cobrar / Emitir Documento** (Botón principal verde esmeralda o navy prominente).
  - `[F4]` Guardar como Cotización / Apartado.
  - `[Esc]` Cancelar Venta / Limpiar Carrito.

---

## 6. Modal de Cobro y Métodos de Pago

El modal de cobro debe ser modal centrado, accesible mediante la tecla `F12`, sin necesidad de utilizar el ratón:

1. **Selección de Tipo de Documento Fiscal:**
   - Factura de Consumidor Final (DTE-01).
   - Comprobante de Crédito Fiscal (CCF - DTE-03) — Requiere NRC, NIT y Giro Comercial.
   - Nota de Remisión / Envío a Domicilio (DTE-04).
   - Factura de Exportación.
2. **Métodos de Pago Soportados (Multipago en una sola transacción):**
   - **Efectivo:** Input con ingreso rápido de denominaciones ($5, $10, $20, $50, $100) y cálculo instantáneo del vuelto / cambio.
   - **Tarjeta Débito / Crédito:** Campo de 4 últimos dígitos y código de autorización POS bancario.
   - **Transferencia / Chivo Wallet / CoDi:** Referencia bancaria comprobable.
   - **Crédito de la Casa / Cuotas:** Selección de plazo (3, 6, 12, 24 meses), tasa de interés y cálculo de cuota mensual.
3. **Acción de Emisión:**
   - Botón `[Enter]` Confirmar y Transmitir a Hacienda / Imprimir Ticket.

---

## 7. Módulo de Facturación y Documentos Tributarios Electrónicos (DTE)

### Formato de Salida
- **Ticket Térmico (80mm):**
  - Encabezado con datos fiscales de Perla de Oriente S.A. de C.V.
  - Código Generación / Sello de Recepción Hacienda (UUID).
  - Código QR estándar de consulta fiscal DTE.
  - Detalle de ítems, garantía de muebles/electrodomésticos (ej. "1 año de garantía en motor de compresor").
  - Datos de transporte/entrega para muebles de gran volumen.
- **Representación Gráfica PDF (Carta / Media Carta):**
  - Formato formal corporativo con logo en alta resolución, colores institucionales `#0F3C6E` y tabla con bordes estilizados `#E2E8F0`.

---

## 8. Módulo Contable y Cuadre Financiero

Para mantener la congruencia entre el Punto de Venta y el módulo de Contabilidad:

- **Arqueo y Cierres de Turno (Corte X y Corte Z):**
  - Cuadre comparativo: Ventas teóricas del sistema vs. Efectivo y vouchers contados físicamente.
  - Detección de sobrantes o faltantes con justificación obligatoria.
- **Generación Automática de Pólizas Contables (Asientos Diarios):**
  - Cada venta cerrada genera automáticamente la partida contable:
    - Cargo a `1101 Efectivo y Equivalentes` (o `1102 Cuentas por Cobrar Clientes`).
    - Abono a `4101 Ingresos por Venta de Mercadería` (Subcuenta: Muebles / Electrodomésticos).
    - Abono a `2107 IVA Débito Fiscal` (13%).
  - En caso de venta a crédito, generación de plan de amortización de cuotas y provisión de intereses devengados.
- **Reportes Contables Mandatorios:**
  - Libro de Ventas a Consumidor Final (Día a día).
  - Libro de Ventas a Contribuyentes (Crédito Fiscal).
  - Balance de Comprobación y Kardex Contable de Inventarios (Costo Promedio o PEPS).

---

## 9. Sistema de Componentes UI y Clases Utilitarias (Guía Tailwind)

### Botones Principales
```html
<!-- Botón Primario de Venta / Acción Principal -->
<button class="bg-[#0F3C6E] hover:bg-[#0A2544] text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#C89D52] focus:outline-none">
  <span>Cobrar [F12]</span>
</button>

<!-- Botón de Acento Dorado / Destacado -->
<button class="bg-[#C89D52] hover:bg-[#b38843] text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors duration-150">
  Nueva Venta [F2]
</button>

<!-- Botón de Acción Crítica / Eliminar -->
<button class="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-medium py-1.5 px-3 rounded-md transition-colors text-xs">
  Eliminar Ítem
</button>
```

### Tarjetas de Producto (POS Card)
```html
<div class="bg-white rounded-xl border border-slate-200 hover:border-[#0F3C6E] hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between cursor-pointer group">
  <div class="aspect-[4/3] w-full rounded-lg bg-slate-100 overflow-hidden mb-2 relative">
    <img src="/productos/refrigeradora.jpg" alt="Producto" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
    <span class="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
      Stock: 8
    </span>
  </div>
  <div>
    <span class="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Línea Blanca</span>
    <h3 class="text-sm font-semibold text-slate-800 line-clamp-2">Refrigeradora Inverter 14p³ Mabe</h3>
  </div>
  <div class="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
    <span class="text-xs text-slate-500 font-medium">Contado</span>
    <span class="text-base font-extrabold font-mono text-[#0F3C6E]">$549.00</span>
  </div>
</div>
```

### Badges de Estado Contable y DTE
```html
<!-- DTE Transmitido / Procesado con éxito -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Transmitido
</span>

<!-- DTE Pendiente / Offline -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pendiente Contingencia
</span>

<!-- Documento Anulado -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Anulado
</span>
```

---

## 10. Reglas de Ergonomía y Atajos de Teclado del POS

| Atajo | Función Operativa | Comportamiento |
| :--- | :--- | :--- |
| `F1` | Ayuda / Manual rápido | Despliega modal con lista de funciones y atajos. |
| `F2` | Nueva Venta | Limpia el ticket actual previa confirmación o guarda el actual en espera. |
| `F3` | Buscar Stock en Otras Sucursales | Consulta en tiempo real bodegas y sucursales hermanas. |
| `F4` | Cotización / Apartado de Mueble | Guarda la orden sin afectar inventario fiscal. |
| `F9` | Seleccionar / Registrar Cliente | Abre el buscador de clientes para ingresar DUI/NIT/NRC. |
| `F10` | Aplicar Descuento Especial | Solicita PIN de autorización de supervisor si supera el 5%. |
| `F12` | Cobrar / Facturar | Abre la pasarela de cobro y opciones de DTE. |
| `Esc` | Cerrar modal / Regresar | Cierra ventanas emergentes o cancela la acción en curso. |
| `Ctrl + P` | Reimprimir último ticket | Reimprime la última transacción completada. |
