# Comercial Perla de Oriente S.A. de C.V.
## Sistema Integral de POS, Facturación Electrónica (DTE) y Contabilidad NIIF

Este proyecto es una solución moderna de software para la gestión comercial y contable en la venta de muebles, electrodomésticos y tecnología, orientada a la simulación y enseñanza práctica de:
1. **Emisión de Comprobantes Tributarios** según normativa de El Salvador (Factura a Consumidor Final DTE-01 y Comprobante de Crédito Fiscal CCF DTE-03 con IVA al 13% y Retención del 1% para Grandes Contribuyentes).
2. **Generación automática de Asientos Contables en Partida Doble** (Libro Diario, Cuentas "T" de Mayorización y Balance de Sumas Iguales).
3. **Liquidación Tributaria** (Simulador de Declaración de IVA Formulario F-07).

> [!TIP]
> **¿Vas a colaborar o meter código en el proyecto?**  
> Lee primero la **[Guía de Desarrollo y Onboarding (docs/GUIA_DESARROLLO.md)](docs/GUIA_DESARROLLO.md)** para conocer el flujo de ramas en `version/1.0`, la arquitectura y qué archivos tocar.

---

## 📁 Estructura del Proyecto

El proyecto está estructurado con una clara separación por capas (**Frontend**, **Backend**, **Documentación** y **Persistencia**):

```
pos-facturacion-contabilidad/
│
├── frontend/                        # Capa de Cliente (SPA)
│   ├── index.html                   # Interfaz de usuario (POS, Diario, Ventas, Inventario)
│   ├── img/                         # Activos visuales y logotipos
│   │   └── logo.jpg
│   └── src/
│       └── js/
│           ├── api.js               # Cliente HTTP hacia la API REST con fallback offline
│           ├── app.js               # Controlador reactivo de interfaz y eventos
│           ├── catalog.js           # Catálogo y modelos de artículos
│           ├── billing.js           # Motor de cálculo fiscal (IVA 13%, Retención 1%, letras)
│           └── accounting.js        # Motor de partida doble, cuentas T y F-07
│
├── backend/                         # Capa de Servidor (API RESTful en Node.js)
│   ├── package.json                 # Configuración del backend
│   └── src/
│       ├── server.js                # Servidor HTTP nativo con soporte CORS y estáticos
│       ├── controllers/             # Controladores de negocio
│       │   ├── productsController.js
│       │   ├── salesController.js
│       │   └── accountingController.js
│       ├── routes/                  # Enrutador REST (/api/products, /api/sales, etc.)
│       │   └── router.js
│       ├── services/                # Lógica tributaria y contable del servidor
│       │   ├── taxService.js
│       │   └── accountingService.js
│       └── data/                    # Persistencia y base de datos
│           ├── database.js          # Gestor de base de datos en archivo JSON
│           ├── initialProducts.json # Semilla de inventario inicial
│           └── db.json              # Estado persistido en disco (generado)
│
├── docs/                            # Documentación y Pautas de Ingeniería
│   ├── design.md                    # Sistema de diseño, paleta institucional y UI/UX
│   └── api-spec.md                  # Especificación técnica de endpoints REST
│
├── package.json                     # Scripts unificados de ejecución
└── README.md                        # Documentación general
```

---

## 🚀 Puesta en Marcha

### Opción A: Modo Full-Stack (Backend API + Frontend)
Requiere **Node.js 18+** instalado:

1. Iniciar el servidor backend:
   ```bash
   npm start
   ```
   o en modo desarrollo con recarga automática:
   ```bash
   npm run dev
   ```

2. Abrir en el navegador:
   - **Aplicación Web (Frontend):** [http://localhost:3000](http://localhost:3000)
   - **API RESTful:** [http://localhost:3000/api](http://localhost:3000/api)

El indicador en la barra superior mostrará:  
`🟢 Backend API: Conectado`

---

### Opción B: Modo Independiente / Standalone (Frontend Puro)
Si no deseas iniciar el servidor Node.js, la aplicación cuenta con un **motor de persistencia híbrido**:
1. Abre directamente con doble clic el archivo `frontend/index.html` en cualquier navegador web moderno (Chrome, Edge, Firefox, Safari).
2. La aplicación detectará que la API no está activa y pasará automáticamente al modo:  
`🔵 Modo: Local (Offline)`

Todas las operaciones (ventas, emisión de tickets, cálculos contables, inventario y asientos) continuarán funcionando al 100% mediante `localStorage`.

---

## 💼 Reglas de Negocio Implementadas

### 1. Parámetros Tributarios (El Salvador)
- **IVA (13%):** Se calcula sobre la base neta de los artículos gravados.
- **Retención 1% IVA (Gran Contribuyente):**
  - Aplicable cuando el cliente posee la calidad de agente de retención y la base imponible es **$\ge \$100.00$**.
  - Deduce el 1% del total a pagar y genera un anticipo de impuesto.
- **Validación de DUI:** El campo de documento valida y admite estrictamente formato de **8 o 9 dígitos numéricos**.

### 2. Contabilidad en Partida Doble
Cada transacción confirmada genera su partida de diario:
- **Cargos (Debe):**
  - `1101 Efectivo y Equivalentes` (o `1102 Cuentas por Cobrar` si es a crédito).
  - `1105 Anticipo de Impuestos - Retención 1%` (si aplica).
- **Abonos (Haber):**
  - `5101 Ingresos por Venta de Mercaderías` (Base gravada neta).
  - `2107 Débito Fiscal IVA` (13%).
- **Validación:** Comprobación estricta de `Debe === Haber` y glosa profesional.

---

## 🎨 Identidad Visual
El proyecto implementa la guía de estilo de [docs/design.md](file:///c:/Users/luigi/Documents/pos-facturacion-contabilidad/docs/design.md):
- **Azul Corporativo / Navy:** `#0F3C6E`
- **Azul Oscuro / Fondo:** `#0A2544`
- **Dorado / Acento Solar:** `#C89D52`
- **Perla / Arena:** `#EADCC1`
- **Tipografías:** *Plus Jakarta Sans* (interfaz y lectura) + *JetBrains Mono* (contabilidad y comprobantes).

