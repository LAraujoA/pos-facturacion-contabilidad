# 🛠️ Guía de Desarrollo y Onboarding para Colaboradores
## Proyecto: `pos-facturacion-contabilidad`
**Comercial Perla de Oriente S.A. de C.V.**

¡Bienvenido al equipo! Este documento es una guía práctica para que cualquier desarrollador que se sume al proyecto sepa exactamente cómo empezar, cómo está estructurado el código y qué archivos debe tocar según la funcionalidad que vaya a implementar.

---

## 📌 1. Regla de Oro: Flujo de Trabajo en Git

> [!IMPORTANT]
> **Toda la colaboración de la versión actual se centraliza sobre la rama `version/1.0`**.  
> Nunca hagas commits directamente en `main` sin pasar antes por `version/1.0`.

### Paso 1: Clonar y posicionarse en la rama `version/1.0`
```bash
# 1. Clonar el repositorio (si aún no lo tienes)
git clone <URL_DEL_REPOSITORIO>
cd pos-facturacion-contabilidad

# 2. Descargar todas las ramas remotas
git fetch origin

# 3. Moverte a la rama base de trabajo
git checkout version/1.0

# 4. Asegurarte de tener los últimos cambios
git pull origin version/1.0
```

### Paso 2: Crear tu propia rama de trabajo (Feature Branch)
Para evitar conflictos con tus compañeros, crea una rama específica para cada tarea o funcionalidad que vayas a programar:

```bash
# Formato recomendado: feature/nombre-tarea o fix/descripcion
git checkout -b feature/nueva-vista-clientes
```

### Paso 3: Guardar cambios y subir tu rama
```bash
git add .
git commit -m "feat: agregar módulo de gestión de clientes frecuentes"
git push origin feature/nueva-vista-clientes
```

### Paso 4: Solicitar integración (Pull Request)
- Entra a GitHub/GitLab y abre un **Pull Request (PR)** teniendo como base la rama **`version/1.0`**.
- Pide a al menos un compañero que revise tu código antes de fusionarlo.

---

## 🚀 2. Requisitos y Puesta en Marcha

El proyecto está diseñado con **cero fricción**: no requiere instalar bases de datos externas ni compilar herramientas pesadas.

### Requisitos Mínimos:
- **Node.js:** Versión 18 o superior (recomendado v22+).
- **Navegador web moderno:** Chrome, Edge, Firefox, Brave o Safari.

### Ejecución en Modo Completo (Backend + Frontend):
Desde la raíz del proyecto ejecuta:
```bash
npm start
```
*O en modo desarrollo con recarga automática en cada cambio:*
```bash
npm run dev
```

Esto levantará el servidor en:
- 💻 **Frontend (App Web):** [http://localhost:3000](http://localhost:3000)
- 📡 **Backend (API REST):** [http://localhost:3000/api](http://localhost:3000/api)

### Ejecución en Modo Rápido (Solo Frontend):
Si solo vas a retocar estilos, HTML o lógica de presentación, puedes abrir directamente con doble clic el archivo `frontend/index.html`. La app detectará automáticamente que la API no está encendida y activará el **Modo Local (Offline)** usando `localStorage`.

---

## 🗺️ 3. Mapa del Código: "¿Qué archivo debo tocar?"

Usa esta tabla de referencia rápida para ubicarte de inmediato:

| ¿Qué quieres hacer o modificar? | Archivo o Carpeta que debes tocar |
| :--- | :--- |
| **Agregar o cambiar productos del catálogo** | `backend/src/data/initialProducts.json` y `frontend/src/js/catalog.js` |
| **Modificar reglas de impuestos (IVA 13%, Retención 1%)** | `backend/src/services/taxService.js` y `frontend/src/js/billing.js` |
| **Cambiar reglas de Partida Doble o cuentas contables** | `backend/src/services/accountingService.js` y `frontend/src/js/accounting.js` |
| **Agregar o modificar endpoints de la API Backend** | `backend/src/routes/router.js` y `backend/src/controllers/` |
| **Modificar cómo se guardan los datos en disco** | `backend/src/data/database.js` |
| **Agregar botones, campos o vistas en la pantalla** | `frontend/index.html` y `frontend/src/js/app.js` |
| **Cambiar el diseño o formato del Comprobante/Ticket DTE** | `frontend/src/js/app.js` (función `openVoucherModal`) y `@media print` en `frontend/index.html` |
| **Consultar colores oficiales y manual de diseño** | `docs/design.md` |
| **Consultar especificación de endpoints REST** | `docs/api-spec.md` |

---

## 🏗️ 4. Arquitectura del Proyecto Explicada

```
pos-facturacion-contabilidad/
│
├── frontend/                     # Capa Visual del Usuario (SPA)
│   ├── index.html                # Layout principal, barra superior, sidebar y modales
│   ├── img/logo.jpg              # Logotipo oficial de Perla de Oriente
│   └── src/js/
│       ├── api.js                # Puente HTTP hacia el Backend con fallback a localStorage
│       ├── app.js                # Controlador UI: eventos, renderizado de tablas y modales
│       ├── catalog.js            # Lista inicial de productos y categorías
│       ├── billing.js            # Motor fiscal del cliente (cálculo de 13%, 1%, letras)
│       └── accounting.js         # Motor contable del cliente (Partida Doble, Mayor, F-07)
│
├── backend/                      # Servidor API RESTful (Node.js)
│   ├── src/
│   │   ├── server.js             # Servidor HTTP nativo, configuración de CORS y estáticos
│   │   ├── routes/router.js      # Enrutamiento de peticiones (/api/products, /api/sales, etc.)
│   │   ├── controllers/          # Controladores (reciben la petición y responden JSON)
│   │   ├── services/             # Lógica de negocio (fórmulas fiscales y asientos contables)
│   │   └── data/                 # Capa de base de datos JSON (database.js y initialProducts.json)
│   └── package.json
│
├── docs/                         # Documentación técnica
│   ├── design.md                 # Paleta de colores, tipografías y reglas de interfaz
│   ├── api-spec.md               # Documentación de endpoints y ejemplos JSON
│   └── GUIA_DESARROLLO.md        # Este documento de onboarding
│
├── package.json                  # Scripts raíz para npm start / npm run dev
└── README.md                     # Visión general del repositorio
```

---

## 💡 5. Reglas de Negocio Clave que NO Debes Romper

Al escribir código, asegúrate de respetar las siguientes reglas ya programadas y validadas:

### 1. Cuadre Contable Obligatorio (`Debe === Haber`)
- Toda venta genera un asiento contable en partida doble.
- Si agregas una cuenta contable nueva (por ejemplo, *Descuentos sobre Ventas* o *Costo de Venta*), **el Total Debe debe ser exactamente igual al Total Haber** al centavo.
- De lo contrario, la partida aparecerá marcada con el badge rojo `Descuadrada`.

### 2. Normativa de IVA y Retención (El Salvador)
- **Tasa de IVA:** `13%` sobre la base gravada neta.
- **Retención 1% Gran Contribuyente:** Solo se aplica si el cliente es marcado como Gran Contribuyente **Y** la base gravada neta es igual o mayor a **`$100.00`**. Si es menor a $100.00, la retención es `$0.00`.
- **Formas de Comprobante:**
  - **Factura (DTE-01):** Solo exige nombre del cliente (por defecto *Consumidor Final*).
  - **Crédito Fiscal (DTE-03):** Exige obligatoriamente *Razón Social*, *NRC*, *NIT/DUI* y *Giro Comercial*.

### 3. Validación de Documento de Identidad (DUI)
- El input de DUI solo permite números y tiene un límite estricto de **8 o 9 dígitos numéricos**. No permitas letras ni guiones en el valor enviado.

### 4. Identidad Visual de la Marca
- Respeta la paleta cromática definida en `docs/design.md`:
  - `brand-navy`: `#0F3C6E` (Barra superior, botones primarios, títulos)
  - `brand-dark`: `#0A2544` (Sidebar lateral y fondos profundos)
  - `brand-gold`: `#C89D52` (Acentos dorados, badges, totales)
  - `brand-pearl`: `#EADCC1` (Contrastes suaves)
- Para números, totales monetarios y códigos SKU usa siempre la fuente monoespaciada (`font-mono` / `JetBrains Mono`).

---

## 🧪 6. Checklist antes de hacer `git push`

Antes de enviar tus cambios al repositorio remoto, verifica lo siguiente:

- [ ] **Sintaxis limpia:** Ejecuta en la terminal para asegurar que no haya errores de JavaScript:
  ```bash
  node -c backend/src/server.js
  node -c frontend/src/js/app.js
  ```
- [ ] **Prueba de Venta:** Realiza una venta en el POS y verifica que:
  1. El stock se descuente en el inventario.
  2. El comprobante se imprima correctamente.
  3. La partida aparezca en el **Libro Diario** con el badge verde `Sumas Iguales Cuadradas`.
- [ ] **Prueba con y sin Backend:** Verifica que la app funcione tanto con `npm start` como abriendo directamente `frontend/index.html`.
- [ ] **Rama correcta:** Asegúrate de estar apuntando tu Pull Request a la rama **`version/1.0`**.

---

¡Cualquier duda o sugerencia de mejora arquitectónica, coordínala con el equipo o abre un Issue en el repositorio!

