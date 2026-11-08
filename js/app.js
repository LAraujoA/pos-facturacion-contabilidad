/**
 * Aplicación Principal SPA — POS, Facturación y Contabilidad
 * Comercial Perla de Oriente S.A. de C.V.
 */

import { INITIAL_PRODUCTS, CATEGORIES } from './catalog.js';
import {
  TAX_CONFIG,
  calculateInvoiceTotals,
  formatCurrency,
  generateVoucherNumber,
  generateDTEUUID,
  validateCustomerData,
  numberToWords
} from './billing.js';
import { createJournalEntry, calculateLedgerTotals } from './accounting.js';

// Claves de almacenamiento local
const STORAGE_KEYS = {
  PRODUCTS: 'perla_oriente_products_v1',
  SALES: 'perla_oriente_sales_v1',
  JOURNAL: 'perla_oriente_journal_v1',
  SEQUENCE_FAC: 'perla_oriente_seq_fac_v1',
  SEQUENCE_CCF: 'perla_oriente_seq_ccf_v1'
};

// Estado Global de la SPA
class AppState {
  constructor() {
    this.activeTab = 'pos';
    this.selectedCategory = 'Todos';
    this.searchQuery = '';
    this.docType = 'FAC'; // 'FAC' o 'CCF'
    this.applyRetention = false;

    this.customer = {
      name: '',
      docNumber: '',
      businessName: '',
      nrc: '',
      nit: '',
      giro: '',
      address: ''
    };

    this.cart = [];
    this.products = this.loadProducts();
    this.sales = this.loadSales();
    this.journalEntries = this.loadJournal();
    this.seqFac = Number(localStorage.getItem(STORAGE_KEYS.SEQUENCE_FAC)) || 1;
    this.seqCcf = Number(localStorage.getItem(STORAGE_KEYS.SEQUENCE_CCF)) || 1;

    this.activeModalVoucher = null;
  }

  loadProducts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [...INITIAL_PRODUCTS];
    } catch {
      return [...INITIAL_PRODUCTS];
    }
  }

  saveProducts() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
  }

  loadSales() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SALES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveSales() {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(this.sales));
  }

  loadJournal() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOURNAL);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveJournal() {
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(this.journalEntries));
  }

  saveSequences() {
    localStorage.setItem(STORAGE_KEYS.SEQUENCE_FAC, this.seqFac);
    localStorage.setItem(STORAGE_KEYS.SEQUENCE_CCF, this.seqCcf);
  }

  resetAllData() {
    if (confirm('¿Deseas reiniciar todos los datos a la configuración inicial de demostración? Se borrarán ventas y partidas.')) {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.SALES);
      localStorage.removeItem(STORAGE_KEYS.JOURNAL);
      localStorage.removeItem(STORAGE_KEYS.SEQUENCE_FAC);
      localStorage.removeItem(STORAGE_KEYS.SEQUENCE_CCF);

      this.products = [...INITIAL_PRODUCTS];
      this.sales = [];
      this.journalEntries = [];
      this.cart = [];
      this.seqFac = 1;
      this.seqCcf = 1;

      renderAll();
      showToast('Datos reiniciados con éxito.', 'info');
    }
  }
}

const state = new AppState();

// --- INICIALIZACIÓN Y EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  initNavigation();
  initSearchAndFilters();
  initCustomerForm();
  initModalEvents();

  renderAll();
});

function initLiveClock() {
  const clockEl = document.getElementById('live-clock');
  function update() {
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('es-SV', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
  }
  update();
  setInterval(update, 1000);
}

function initNavigation() {
  const navButtons = document.querySelectorAll('[data-nav-tab]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-nav-tab');
      switchTab(targetTab);
    });
  });

  const resetBtn = document.getElementById('btn-reset-demo');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => state.resetAllData());
  }
}

export function switchTab(tabName) {
  state.activeTab = tabName;

  // Actualizar botones del sidebar
  document.querySelectorAll('[data-nav-tab]').forEach(btn => {
    const isCurrent = btn.getAttribute('data-nav-tab') === tabName;
    if (isCurrent) {
      btn.classList.add('bg-brand-navy', 'text-brand-pearl', 'font-semibold', 'shadow-sm');
      btn.classList.remove('text-slate-300', 'hover:bg-slate-800');
    } else {
      btn.classList.remove('bg-brand-navy', 'text-brand-pearl', 'font-semibold', 'shadow-sm');
      btn.classList.add('text-slate-300', 'hover:bg-slate-800');
    }
  });

  // Mostrar la sección correspondiente
  const sections = ['pos', 'accounting', 'sales', 'inventory'];
  sections.forEach(sec => {
    const el = document.getElementById(`view-${sec}`);
    if (el) {
      if (sec === tabName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Renderizar la vista activada
  if (tabName === 'pos') renderPosCatalog();
  if (tabName === 'accounting') renderAccountingView();
  if (tabName === 'sales') renderSalesView();
  if (tabName === 'inventory') renderInventoryView();
}

function initSearchAndFilters() {
  const searchInput = document.getElementById('pos-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value.toLowerCase();
      renderPosCatalog();
    });
  }

  const categoryContainer = document.getElementById('pos-category-filters');
  if (categoryContainer) {
    categoryContainer.innerHTML = CATEGORIES.map(cat => `
      <button
        class="category-pill px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
          state.selectedCategory === cat
            ? 'bg-brand-navy text-white shadow-sm'
            : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-navy'
        }"
        data-category="${cat}"
      >
        ${cat}
      </button>
    `).join('');

    categoryContainer.addEventListener('click', e => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      state.selectedCategory = btn.getAttribute('data-category');

      document.querySelectorAll('.category-pill').forEach(b => {
        const isCurrent = b.getAttribute('data-category') === state.selectedCategory;
        if (isCurrent) {
          b.className = 'category-pill px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 bg-brand-navy text-white shadow-sm';
        } else {
          b.className = 'category-pill px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 bg-white text-slate-600 border border-slate-200 hover:border-brand-navy';
        }
      });

      renderPosCatalog();
    });
  }
}

function initCustomerForm() {
  const docTypeFac = document.getElementById('doctype-fac');
  const docTypeCcf = document.getElementById('doctype-ccf');
  const ccfFields = document.getElementById('ccf-fields');
  const facFields = document.getElementById('fac-fields');
  const retentionSwitch = document.getElementById('retention-switch');

  function updateDocTypeUI() {
    if (state.docType === 'CCF') {
      docTypeCcf.classList.add('bg-brand-navy', 'text-white', 'shadow-sm');
      docTypeCcf.classList.remove('bg-white', 'text-slate-700');
      docTypeFac.classList.remove('bg-brand-navy', 'text-white', 'shadow-sm');
      docTypeFac.classList.add('bg-white', 'text-slate-700');

      ccfFields.classList.remove('hidden');
      facFields.classList.add('hidden');
    } else {
      docTypeFac.classList.add('bg-brand-navy', 'text-white', 'shadow-sm');
      docTypeFac.classList.remove('bg-white', 'text-slate-700');
      docTypeCcf.classList.remove('bg-brand-navy', 'text-white', 'shadow-sm');
      docTypeCcf.classList.add('bg-white', 'text-slate-700');

      facFields.classList.remove('hidden');
      ccfFields.classList.add('hidden');
    }
    renderCartTotals();
  }

  if (docTypeFac && docTypeCcf) {
    docTypeFac.addEventListener('click', () => {
      state.docType = 'FAC';
      updateDocTypeUI();
    });
    docTypeCcf.addEventListener('click', () => {
      state.docType = 'CCF';
      updateDocTypeUI();
    });
  }

  if (retentionSwitch) {
    retentionSwitch.addEventListener('change', e => {
      state.applyRetention = e.target.checked;
      renderCartTotals();
    });
  }

  // Bind inputs to customer state
  const bindInput = (id, prop) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', e => {
        state.customer[prop] = e.target.value;
      });
    }
  };

  bindInput('cust-fac-name', 'name');

  // Control estricto de DUI: solo números y límite estricto de 8 a 9 dígitos
  const facDocInput = document.getElementById('cust-fac-doc');
  if (facDocInput) {
    const sanitizeDui = () => {
      const digitsOnly = facDocInput.value.replace(/\D/g, '').slice(0, 9);
      facDocInput.value = digitsOnly;
      state.customer.docNumber = digitsOnly;
    };
    facDocInput.addEventListener('input', sanitizeDui);
    facDocInput.addEventListener('paste', () => setTimeout(sanitizeDui, 0));
  }

  bindInput('cust-ccf-name', 'businessName');
  bindInput('cust-ccf-nrc', 'nrc');
  bindInput('cust-ccf-nit', 'nit');
  bindInput('cust-ccf-giro', 'giro');
  bindInput('cust-ccf-address', 'address');

  // Botón Limpiar Carrito
  const clearCartBtn = document.getElementById('btn-clear-cart');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      if (state.cart.length === 0) return;
      if (confirm('¿Deseas vaciar el carrito actual?')) {
        state.cart = [];
        renderCart();
        showToast('Carrito vaciado', 'info');
      }
    });
  }

  // Botón Confirmar Venta
  const checkoutBtn = document.getElementById('btn-checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => processCheckout());
  }
}

function initModalEvents() {
  const closeBtn = document.getElementById('btn-close-modal');
  const printBtn = document.getElementById('btn-print-voucher');
  const modal = document.getElementById('voucher-modal');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeVoucherModal);
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeVoucherModal();
      }
    });
  }
}

// --- RENDERIZADO GENERAL ---
function renderAll() {
  renderPosCatalog();
  renderCart();
  renderAccountingView();
  renderSalesView();
  renderInventoryView();
}

// --- MÓDULO 1: CATÁLOGO Y POS ---
function renderPosCatalog() {
  const container = document.getElementById('pos-products-grid');
  if (!container) return;

  const filtered = state.products.filter(p => {
    const matchesCat = state.selectedCategory === 'Todos' || p.category === state.selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(state.searchQuery) ||
                         p.code.toLowerCase().includes(state.searchQuery) ||
                         p.description.toLowerCase().includes(state.searchQuery);
    return matchesCat && matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <p class="font-medium text-slate-600">No se encontraron productos coincidentes</p>
        <p class="text-xs text-slate-400 mt-1">Prueba con otra categoría o término de búsqueda.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const inCart = state.cart.find(item => item.id === p.id);
    const availableStock = p.stock - (inCart ? inCart.quantity : 0);
    const isOutOfStock = availableStock <= 0;
    const priceWithIva = p.price * (1 + TAX_CONFIG.IVA_RATE);

    // Icono SVG según categoría/tipo de artículo
    const iconSvg = getProductIcon(p.icon);

    return `
      <div class="bg-white rounded-xl border border-slate-200 hover:border-brand-navy hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between group ${
        isOutOfStock ? 'opacity-60 pointer-events-none' : ''
      }">
        <div>
          <!-- Icono / Imagen y Badges -->
          <div class="h-28 w-full rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-3 relative overflow-hidden border border-slate-100">
            <div class="text-brand-navy group-hover:scale-110 transition-transform duration-200">
              ${iconSvg}
            </div>
            <span class="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isOutOfStock
                ? 'bg-rose-500 text-white'
                : availableStock <= 2
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-emerald-600 text-white'
            }">
              ${isOutOfStock ? 'Agotado' : `Stock: ${availableStock}`}
            </span>
            <span class="absolute bottom-2 left-2 text-[10px] font-mono text-slate-500 bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
              ${p.code}
            </span>
          </div>

          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[10px] uppercase tracking-wider font-semibold text-brand-gold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
              ${p.category}
            </span>
          </div>

          <h3 class="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight title-hover" title="${p.name}">
            ${p.name}
          </h3>
          <p class="text-xs text-slate-500 mt-1 line-clamp-2">${p.description}</p>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-100">
          <div class="flex items-baseline justify-between mb-2">
            <div>
              <span class="text-[10px] text-slate-400 block leading-none">Base Neta</span>
              <span class="text-sm font-bold font-mono text-slate-700">${formatCurrency(p.price)}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-brand-navy font-semibold block leading-none">Con IVA (13%)</span>
              <span class="text-base font-extrabold font-mono text-brand-navy">${formatCurrency(priceWithIva)}</span>
            </div>
          </div>

          <button
            class="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-brand-navy hover:bg-brand-dark text-white active:scale-95 shadow-sm hover:shadow'
            }"
            onclick="window.addToCart('${p.id}')"
            ${isOutOfStock ? 'disabled' : ''}
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span>${isOutOfStock ? 'Sin Existencias' : 'Agregar al Ticket'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// --- CARRITO DE COMPRAS ---
window.addToCart = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast(`No puedes agregar más de ${product.stock} unidades de este producto.`, 'warning');
      return;
    }
    existing.quantity++;
  } else {
    if (product.stock <= 0) {
      showToast('Producto agotado.', 'error');
      return;
    }
    state.cart.push({
      ...product,
      quantity: 1
    });
  }

  renderCart();
  renderPosCatalog();
  showToast(`"${product.name}" agregado al ticket.`, 'info');
};

window.updateCartQty = function(productId, delta) {
  const item = state.cart.find(i => i.id === productId);
  const product = state.products.find(p => p.id === productId);
  if (!item || !product) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    window.removeFromCart(productId);
    return;
  }
  if (newQty > product.stock) {
    showToast(`Stock máximo disponible: ${product.stock} unidades`, 'warning');
    return;
  }

  item.quantity = newQty;
  renderCart();
  renderPosCatalog();
};

window.removeFromCart = function(productId) {
  state.cart = state.cart.filter(i => i.id !== productId);
  renderCart();
  renderPosCatalog();
};

function renderCart() {
  const container = document.getElementById('pos-cart-items');
  const countBadge = document.getElementById('cart-items-count');
  if (!container) return;

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (countBadge) countBadge.textContent = totalItems;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="h-48 flex flex-col items-center justify-center text-slate-400 text-center px-4">
        <svg class="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg>
        <p class="text-xs font-semibold text-slate-600">Ticket Vacío</p>
        <p class="text-[11px] text-slate-400 mt-0.5">Selecciona productos del catálogo a la izquierda para armar la factura.</p>
      </div>
    `;
    renderCartTotals();
    return;
  }

  container.innerHTML = state.cart.map(item => {
    const lineTotalNet = item.price * item.quantity;
    const lineTotalWithIva = lineTotalNet * (1 + TAX_CONFIG.IVA_RATE);

    return `
      <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
        <div class="flex-1 pr-2 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-mono text-slate-500 font-bold">${item.code}</span>
            <span class="text-[10px] text-brand-gold font-medium uppercase truncate">${item.category}</span>
          </div>
          <p class="text-xs font-semibold text-slate-800 truncate" title="${item.name}">${item.name}</p>
          <div class="text-[11px] text-slate-500 font-mono mt-0.5">
            ${formatCurrency(item.price)} net c/u · <span class="font-medium text-brand-navy">${formatCurrency(lineTotalWithIva)} c/IVA</span>
          </div>
        </div>

        <!-- Controles de Cantidad -->
        <div class="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-1 py-0.5">
          <button
            class="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded text-xs font-bold"
            onclick="window.updateCartQty('${item.id}', -1)"
            title="Reducir"
          >
            -
          </button>
          <span class="w-6 text-center text-xs font-bold font-mono text-slate-800">${item.quantity}</span>
          <button
            class="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded text-xs font-bold"
            onclick="window.updateCartQty('${item.id}', 1)"
            title="Aumentar"
          >
            +
          </button>
        </div>

        <!-- Botón Eliminar -->
        <button
          class="ml-2 text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
          onclick="window.removeFromCart('${item.id}')"
          title="Eliminar ítem"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  renderCartTotals();
}

function renderCartTotals() {
  const totals = calculateInvoiceTotals(state.cart, state.applyRetention);

  const subtotalEl = document.getElementById('calc-subtotal');
  const ivaEl = document.getElementById('calc-iva');
  const retRowEl = document.getElementById('calc-retention-row');
  const retAmountEl = document.getElementById('calc-retention');
  const totalEl = document.getElementById('calc-total');
  const checkoutBtn = document.getElementById('btn-checkout');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(totals.baseGravada);
  if (ivaEl) ivaEl.textContent = formatCurrency(totals.ivaDebito);

  if (retRowEl && retAmountEl) {
    if (state.applyRetention && totals.baseGravada >= TAX_CONFIG.MIN_RETENTION_BASE) {
      retRowEl.classList.remove('hidden');
      retAmountEl.textContent = `- ${formatCurrency(totals.retencion1)}`;
    } else {
      retRowEl.classList.add('hidden');
    }
  }

  if (totalEl) totalEl.textContent = formatCurrency(totals.totalPagar);

  if (checkoutBtn) {
    checkoutBtn.disabled = state.cart.length === 0;
  }
}

// --- PROCESAR VENTA / CHECKOUT ---
function processCheckout() {
  if (state.cart.length === 0) {
    showToast('El ticket no contiene artículos para facturar.', 'warning');
    return;
  }

  // Validaciones del cliente
  const validation = validateCustomerData(state.docType, { ...state.customer });
  if (!validation.isValid) {
    showToast(validation.errors[0], 'error');
    return;
  }

  // Comprobar inventario antes de descontar
  for (const item of state.cart) {
    const prod = state.products.find(p => p.id === item.id);
    if (!prod || prod.stock < item.quantity) {
      showToast(`Stock insuficiente para "${item.name}". Disponible: ${prod ? prod.stock : 0}`, 'error');
      return;
    }
  }

  // 1. Descontar inventario
  state.cart.forEach(item => {
    const prod = state.products.find(p => p.id === item.id);
    if (prod) {
      prod.stock -= item.quantity;
    }
  });
  state.saveProducts();

  // 2. Correlativo y códigos DTE
  const seqNumber = state.docType === 'CCF' ? state.seqCcf : state.seqFac;
  const voucherNumber = generateVoucherNumber(state.docType, seqNumber);
  const dteUUID = generateDTEUUID();

  if (state.docType === 'CCF') {
    state.seqCcf++;
  } else {
    state.seqFac++;
  }
  state.saveSequences();

  // 3. Totales
  const totals = calculateInvoiceTotals(state.cart, state.applyRetention);

  // 4. Crear objeto de Venta
  const sale = {
    id: `sale-${Date.now()}`,
    voucherNumber,
    dteUUID,
    docType: state.docType,
    customer: validation.sanitizedCustomer,
    items: [...totals.items],
    totals,
    timestamp: new Date().toISOString()
  };

  state.sales.unshift(sale);
  state.saveSales();

  // 5. Generar Partida Contable en Libro Diario
  const entryNumber = state.journalEntries.length + 1;
  const journalEntry = createJournalEntry(sale, entryNumber);
  state.journalEntries.unshift(journalEntry);
  state.saveJournal();

  // 6. Resetear carrito y formulario
  state.cart = [];
  state.customer = {
    name: '',
    docNumber: '',
    businessName: '',
    nrc: '',
    nit: '',
    giro: '',
    address: ''
  };

  // Limpiar campos del DOM
  ['cust-fac-name', 'cust-fac-doc', 'cust-ccf-name', 'cust-ccf-nrc', 'cust-ccf-nit', 'cust-ccf-giro', 'cust-ccf-address'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderAll();
  showToast(`Venta confirmada con éxito. Comprobante: ${voucherNumber}`, 'success');

  // 7. Abrir modal con comprobante emitido
  openVoucherModal(sale);
}

// --- MÓDULO 2: LIBRO DIARIO CONTABLE ---
function renderAccountingView() {
  const container = document.getElementById('journal-entries-container');
  const summaryCount = document.getElementById('ledger-entry-count');
  const summaryDebit = document.getElementById('ledger-total-debit');
  const summaryCredit = document.getElementById('ledger-total-credit');
  const summaryBadge = document.getElementById('ledger-balance-badge');

  if (!container) return;

  const ledgerSummary = calculateLedgerTotals(state.journalEntries);

  if (summaryCount) summaryCount.textContent = ledgerSummary.entryCount;
  if (summaryDebit) summaryDebit.textContent = formatCurrency(ledgerSummary.accumulatedDebit);
  if (summaryCredit) summaryCredit.textContent = formatCurrency(ledgerSummary.accumulatedCredit);

  if (summaryBadge) {
    if (ledgerSummary.entryCount === 0) {
      summaryBadge.innerHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Sin Movimientos</span>`;
    } else if (ledgerSummary.allBalanced) {
      summaryBadge.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Sumas Iguales Cuadradas (Debe === Haber)
        </span>
      `;
    } else {
      summaryBadge.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span> Descuadre Contable: ${formatCurrency(ledgerSummary.difference)}
        </span>
      `;
    }
  }

  if (state.journalEntries.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
        <svg class="w-14 h-14 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-base font-semibold text-slate-600">Aún no se han generado asientos contables</p>
        <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Cada venta realizada en el Terminal POS generará automáticamente su respectiva partida de diario en partida doble con desglose de IVA y Efectivo.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.journalEntries.map(entry => {
    const formattedDate = new Date(entry.timestamp).toLocaleString('es-SV', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    return `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:border-brand-navy transition-all duration-150">
        <!-- Cabecera de la Partida -->
        <div class="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-md text-xs font-extrabold bg-brand-navy text-brand-pearl font-mono">
              PARTIDA N° ${String(entry.entryNumber).padStart(4, '0')}
            </span>
            <span class="text-xs text-slate-500 font-medium">
              ${formattedDate}
            </span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-brand-navy border border-blue-200">
              Ref: ${entry.voucherNumber}
            </span>
          </div>

          <div>
            ${
              entry.isBalanced
                ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    Cuadrada
                  </span>`
                : `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    Descuadrada
                  </span>`
            }
          </div>
        </div>

        <!-- Tabla de Cuentas (Partida Doble) -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100/70 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2 px-4 w-24">Código</th>
                <th class="py-2 px-4">Cuenta / Concepto Contable</th>
                <th class="py-2 px-4 text-right w-36">Debe ($)</th>
                <th class="py-2 px-4 text-right w-36">Haber ($)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono">
              ${entry.rows.map(row => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-slate-700">${row.code}</td>
                  <td class="py-2.5 px-4 font-sans">
                    <p class="font-bold text-slate-800 ${row.credit > 0 ? 'pl-4 text-slate-700' : ''}">
                      ${row.credit > 0 ? 'a) ' : ''}${row.accountName}
                    </p>
                    <p class="text-[11px] text-slate-500 ${row.credit > 0 ? 'pl-8' : 'pl-3'}">
                      ${row.subCode} · ${row.subName}
                    </p>
                  </td>
                  <td class="py-2.5 px-4 text-right font-bold text-slate-800 ${row.debit > 0 ? 'text-emerald-700 bg-emerald-50/20' : 'text-slate-300'}">
                    ${row.debit > 0 ? formatCurrency(row.debit) : '—'}
                  </td>
                  <td class="py-2.5 px-4 text-right font-bold text-slate-800 ${row.credit > 0 ? 'text-brand-navy bg-blue-50/20' : 'text-slate-300'}">
                    ${row.credit > 0 ? formatCurrency(row.credit) : '—'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <!-- Fila de Sumas Iguales -->
            <tfoot class="bg-slate-100 font-mono font-bold text-slate-800 border-t-2 border-slate-300">
              <tr>
                <td colspan="2" class="py-2 px-4 text-right font-sans text-xs uppercase tracking-wider text-slate-600">
                  Sumas Iguales:
                </td>
                <td class="py-2 px-4 text-right text-emerald-800 font-extrabold">
                  ${formatCurrency(entry.totalDebit)}
                </td>
                <td class="py-2 px-4 text-right text-emerald-800 font-extrabold">
                  ${formatCurrency(entry.totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Glosa Contable -->
        <div class="px-5 py-2.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <span class="font-bold text-slate-700 shrink-0">Concepto / Glosa:</span>
          <p class="italic text-slate-600">${entry.glosa}</p>
        </div>
      </div>
    `;
  }).join('');
}

// --- MÓDULO 3: HISTORIAL DE VENTAS ---
function renderSalesView() {
  const container = document.getElementById('sales-history-tbody');
  const countEl = document.getElementById('sales-stat-count');
  const baseEl = document.getElementById('sales-stat-base');
  const ivaEl = document.getElementById('sales-stat-iva');
  const totalEl = document.getElementById('sales-stat-total');

  if (!container) return;

  const totalBase = state.sales.reduce((acc, s) => acc + s.totals.baseGravada, 0);
  const totalIva = state.sales.reduce((acc, s) => acc + s.totals.ivaDebito, 0);
  const totalPagar = state.sales.reduce((acc, s) => acc + s.totals.totalPagar, 0);

  if (countEl) countEl.textContent = state.sales.length;
  if (baseEl) baseEl.textContent = formatCurrency(totalBase);
  if (ivaEl) ivaEl.textContent = formatCurrency(totalIva);
  if (totalEl) totalEl.textContent = formatCurrency(totalPagar);

  if (state.sales.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-slate-400">
          No hay ventas registradas en esta sesión.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = state.sales.map(s => {
    const dateStr = new Date(s.timestamp).toLocaleString('es-SV', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
    const clientName = s.docType === 'CCF' ? s.customer.businessName : (s.customer.name || 'Consumidor Final');

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-mono font-bold text-brand-navy">${s.voucherNumber}</td>
        <td class="py-3 px-4 text-slate-500 text-xs">${dateStr}</td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold ${
            s.docType === 'CCF' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
          }">
            ${s.docType === 'CCF' ? 'Crédito Fiscal (DTE-03)' : 'Factura (DTE-01)'}
          </span>
        </td>
        <td class="py-3 px-4 font-medium text-slate-800 text-xs max-w-[180px] truncate" title="${clientName}">
          ${clientName}
        </td>
        <td class="py-3 px-4 font-mono text-right text-xs">${formatCurrency(s.totals.baseGravada)}</td>
        <td class="py-3 px-4 font-mono text-right text-xs text-amber-700">${formatCurrency(s.totals.ivaDebito)}</td>
        <td class="py-3 px-4 font-mono text-right text-xs ${s.totals.retencion1 > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}">
          ${s.totals.retencion1 > 0 ? formatCurrency(s.totals.retencion1) : '—'}
        </td>
        <td class="py-3 px-4 font-mono font-bold text-right text-xs text-brand-navy">${formatCurrency(s.totals.totalPagar)}</td>
        <td class="py-3 px-4 text-center">
          <button
            class="text-brand-navy hover:text-brand-gold bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 mx-auto"
            onclick="window.viewSaleVoucher('${s.id}')"
            title="Ver o Reimprimir Comprobante"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            Ver
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.viewSaleVoucher = function(saleId) {
  const sale = state.sales.find(s => s.id === saleId);
  if (sale) {
    openVoucherModal(sale);
  }
};

// --- MÓDULO 4: INVENTARIO ---
function renderInventoryView() {
  const container = document.getElementById('inventory-tbody');
  const statTotalItems = document.getElementById('inv-stat-items');
  const statLowStock = document.getElementById('inv-stat-low');

  if (!container) return;

  const totalStock = state.products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = state.products.filter(p => p.stock > 0 && p.stock <= 2).length;

  if (statTotalItems) statTotalItems.textContent = totalStock;
  if (statLowStock) statLowStock.textContent = lowStockCount;

  container.innerHTML = state.products.map(p => {
    const priceWithIva = p.price * (1 + TAX_CONFIG.IVA_RATE);
    const isOutOfStock = p.stock <= 0;
    const isLow = p.stock > 0 && p.stock <= 2;

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-mono font-bold text-slate-700">${p.code}</td>
        <td class="py-3 px-4">
          <p class="font-semibold text-slate-800 text-xs">${p.name}</p>
          <p class="text-[11px] text-slate-500">${p.description}</p>
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            ${p.category}
          </span>
        </td>
        <td class="py-3 px-4 font-mono text-right text-xs">${formatCurrency(p.price)}</td>
        <td class="py-3 px-4 font-mono text-right text-xs font-semibold text-brand-navy">${formatCurrency(priceWithIva)}</td>
        <td class="py-3 px-4 text-center">
          <span class="font-mono font-bold text-sm ${isOutOfStock ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}">
            ${p.stock}
          </span>
        </td>
        <td class="py-3 px-4 text-center">
          ${
            isOutOfStock
              ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Agotado</span>'
              : isLow
              ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Bajo Stock</span>'
              : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Disponible</span>'
          }
        </td>
        <td class="py-3 px-4 text-center">
          <button
            class="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 hover:bg-brand-navy hover:text-white transition-colors"
            onclick="window.quickRestock('${p.id}')"
            title="Añadir 5 unidades de stock"
          >
            +5 Reabastecer
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.quickRestock = function(productId) {
  const p = state.products.find(item => item.id === productId);
  if (p) {
    p.stock += 5;
    state.saveProducts();
    renderInventoryView();
    renderPosCatalog();
    showToast(`Stock de "${p.name}" actualizado a ${p.stock} unidades.`, 'success');
  }
};

// --- MODAL DE COMPROBANTE TRIBUTARIO (DTE) ---
function openVoucherModal(sale) {
  state.activeModalVoucher = sale;
  const modal = document.getElementById('voucher-modal');
  const content = document.getElementById('voucher-printable-content');
  if (!modal || !content) return;

  const isCCF = sale.docType === 'CCF';
  const formattedDate = new Date(sale.timestamp).toLocaleString('es-SV', {
    dateStyle: 'long',
    timeStyle: 'medium'
  });
  const amountWords = numberToWords(sale.totals.totalPagar);

  content.innerHTML = `
    <!-- ENCABEZADO FORMAL FISCAL PERLA DE ORIENTE -->
    <div class="border-b-2 border-brand-navy pb-4 mb-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="w-14 h-14 rounded-lg bg-brand-navy text-brand-gold flex items-center justify-center font-bold text-2xl font-serif shadow-sm shrink-0">
            PO
          </div>
          <div>
            <h1 class="text-base font-extrabold text-brand-navy uppercase tracking-wide leading-tight">
              ${TAX_CONFIG.COMPANY.name}
            </h1>
            <p class="text-xs font-semibold text-brand-gold">${TAX_CONFIG.COMPANY.tradeName}</p>
            <p class="text-[11px] text-slate-500 leading-tight mt-0.5">${TAX_CONFIG.COMPANY.giro}</p>
            <p class="text-[11px] text-slate-500 leading-tight mt-0.5">
              ${TAX_CONFIG.COMPANY.address} · Tel: ${TAX_CONFIG.COMPANY.phone}
            </p>
            <div class="flex items-center gap-3 text-[11px] font-mono text-slate-700 mt-1 font-semibold">
              <span>NIT: ${TAX_CONFIG.COMPANY.nit}</span>
              <span>NRC: ${TAX_CONFIG.COMPANY.nrc}</span>
            </div>
          </div>
        </div>

        <!-- RECUADRO DE CONTROL TRIBUTARIO -->
        <div class="border-2 border-brand-navy rounded-lg p-3 text-center bg-slate-50/50 min-w-[220px]">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Documento Tributario Electrónico</p>
          <h2 class="text-sm font-extrabold text-brand-navy uppercase py-1 border-y border-brand-navy/30 my-1">
            ${isCCF ? 'COMPROBANTE DE CRÉDITO FISCAL' : 'FACTURA DE CONSUMIDOR FINAL'}
          </h2>
          <p class="text-sm font-extrabold font-mono text-brand-navy">${sale.voucherNumber}</p>
          <p class="text-[10px] font-mono text-slate-400 mt-1">DTE Versión 3 · El Salvador</p>
        </div>
      </div>

      <!-- METADATOS FISCALES DTE -->
      <div class="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-600 bg-slate-50 p-2 rounded">
        <div>
          <span class="font-bold text-slate-700">Código de Generación (UUID):</span><br/>
          <span class="break-all text-brand-navy font-semibold">${sale.dteUUID}</span>
        </div>
        <div>
          <span class="font-bold text-slate-700">Fecha y Hora de Emisión:</span><br/>
          <span>${formattedDate}</span>
        </div>
      </div>
    </div>

    <!-- DATOS DEL RECEPTOR / CLIENTE -->
    <div class="bg-slate-50/70 border border-slate-200 rounded-lg p-3 mb-4 text-xs">
      <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <span class="text-slate-500 font-medium">Receptor / Cliente:</span>
          <p class="font-bold text-slate-900">${isCCF ? sale.customer.businessName : (sale.customer.name || 'Consumidor Final')}</p>
        </div>
        <div>
          <span class="text-slate-500 font-medium">${isCCF ? 'NRC:' : 'DUI / Documento:'}</span>
          <p class="font-mono font-bold text-slate-900">${isCCF ? sale.customer.nrc : (sale.customer.docNumber || 'No consignado')}</p>
        </div>
        ${
          isCCF
            ? `
          <div>
            <span class="text-slate-500 font-medium">NIT / DUI Contribuyente:</span>
            <p class="font-mono text-slate-900">${sale.customer.nit || '—'}</p>
          </div>
          <div>
            <span class="text-slate-500 font-medium">Giro Comercial:</span>
            <p class="text-slate-900">${sale.customer.giro || '—'}</p>
          </div>
          <div class="col-span-2">
            <span class="text-slate-500 font-medium">Dirección Fiscal:</span>
            <p class="text-slate-900">${sale.customer.address || 'San Miguel, El Salvador'}</p>
          </div>
        `
            : ''
        }
      </div>
    </div>

    <!-- TABLA DE ARTÍCULOS -->
    <div class="border border-slate-200 rounded-lg overflow-hidden mb-4">
      <table class="w-full text-xs text-left">
        <thead class="bg-brand-navy text-brand-pearl font-semibold uppercase text-[10px] tracking-wider">
          <tr>
            <th class="py-2 px-3 text-center w-12">Cant.</th>
            <th class="py-2 px-3 w-20">Código</th>
            <th class="py-2 px-3">Descripción del Bien</th>
            <th class="py-2 px-3 text-right w-24">Precio Unit.</th>
            <th class="py-2 px-3 text-right w-28">Ventas Gravadas</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-mono">
          ${sale.items.map(item => `
            <tr>
              <td class="py-2 px-3 text-center font-bold text-slate-800">${item.quantity}</td>
              <td class="py-2 px-3 text-slate-500 text-[11px]">${item.code}</td>
              <td class="py-2 px-3 font-sans">
                <p class="font-semibold text-slate-800">${item.name}</p>
                <p class="text-[10px] text-slate-500">${item.warranty || 'Garantía legal vigente'}</p>
              </td>
              <td class="py-2 px-3 text-right text-slate-700">${formatCurrency(item.price)}</td>
              <td class="py-2 px-3 text-right font-bold text-slate-900">${formatCurrency(item.lineBase)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- TOTALES Y DESGLOSE FISCAL -->
    <div class="grid grid-cols-2 gap-4 items-start mb-4">
      <!-- SON EN LETRAS -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Valor en Letras:</span>
        <p class="font-bold text-slate-800 text-[11px] leading-snug">${amountWords}</p>

        <div class="mt-3 pt-3 border-t border-slate-200 flex items-center gap-3">
          <!-- QR Simulado DTE -->
          <div class="w-16 h-16 bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0">
            <svg class="w-14 h-14 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h-4v2h2v2h-2v2h4v-2h2v-2h-2v-2zm-2 2h2v2h-2v-2zM14 14h2v2h-2v-2zm4 4v4h4v-4h-4z"/>
            </svg>
          </div>
          <div class="text-[10px] text-slate-500 leading-tight">
            <p class="font-semibold text-brand-navy">Consulta Pública DTE Ministerio de Hacienda</p>
            <p class="mt-0.5">Escanea para verificar la autenticidad del documento tributario.</p>
          </div>
        </div>
      </div>

      <!-- DESGLOSE NUMÉRICO -->
      <div class="border border-slate-200 rounded-lg overflow-hidden font-mono text-xs">
        <div class="p-2.5 flex justify-between bg-slate-50/70 border-b border-slate-200">
          <span class="text-slate-600 font-sans font-medium">Sumas (Ventas Gravadas):</span>
          <span class="font-bold text-slate-800">${formatCurrency(sale.totals.baseGravada)}</span>
        </div>
        <div class="p-2.5 flex justify-between bg-white border-b border-slate-200">
          <span class="text-slate-600 font-sans font-medium">13% IVA (Débito Fiscal):</span>
          <span class="font-bold text-amber-700">${formatCurrency(sale.totals.ivaDebito)}</span>
        </div>
        <div class="p-2.5 flex justify-between bg-slate-50/70 border-b border-slate-200">
          <span class="text-slate-600 font-sans font-medium">Subtotal con Impuesto:</span>
          <span class="font-bold text-slate-800">${formatCurrency(sale.totals.subtotalConIva)}</span>
        </div>
        ${
          sale.totals.retencion1 > 0
            ? `
          <div class="p-2.5 flex justify-between bg-rose-50/70 border-b border-slate-200 text-rose-700">
            <span class="font-sans font-medium">(-) Retención 1% IVA:</span>
            <span class="font-bold">- ${formatCurrency(sale.totals.retencion1)}</span>
          </div>
        `
            : ''
        }
        <div class="p-3 flex justify-between bg-brand-navy text-brand-pearl items-baseline">
          <span class="font-sans font-bold text-sm tracking-wide">TOTAL A PAGAR:</span>
          <span class="font-bold text-lg font-mono text-white">${formatCurrency(sale.totals.totalPagar)}</span>
        </div>
      </div>
    </div>

    <!-- PIE LEGAL -->
    <div class="text-[10px] text-slate-400 text-center border-t border-slate-200 pt-3 leading-relaxed">
      <p>Comercial Perla de Oriente S.A. de C.V. — Sistema POS & Facturación Integrada.</p>
      <p>Este documento es una representación gráfica de un Documento Tributario Electrónico (DTE) transmitido a la Administración Tributaria.</p>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeVoucherModal() {
  const modal = document.getElementById('voucher-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  state.activeModalVoucher = null;
}

// --- NOTIFICACIONES TOAST ---
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast-notification');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;

  let bgClass = 'bg-slate-900 border-slate-700 text-white';
  if (type === 'success') bgClass = 'bg-emerald-900 border-emerald-700 text-emerald-100';
  if (type === 'warning') bgClass = 'bg-amber-900 border-amber-700 text-amber-100';
  if (type === 'error') bgClass = 'bg-rose-900 border-rose-700 text-rose-100';

  toast.className = `fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform ${bgClass}`;
  toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
  }, 3500);
}

// Helper para iconos SVG en tarjetas de producto
function getProductIcon(type) {
  switch (type) {
    case 'sofa':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 11V7a2 2 0 012-2h12a2 2 0 012 2v4m-16 0a3 3 0 003 3h10a3 3 0 003-3m-16 0v7a2 2 0 002 2h1a2 2 0 002-2v-2h8v2a2 2 0 002 2h1a2 2 0 002-2v-7"></path></svg>`;
    case 'table':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M5 10v10M19 10v10M8 10V4h8v6"></path></svg>`;
    case 'bed':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-6h14l2 6M3 12v7a1 1 0 001 1h16a1 1 0 001-1v-7M3 12h18M6 8h4v4H6z"></path></svg>`;
    case 'wardrobe':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 4h14v16H5zM12 4v16M9 12h.01M15 12h.01"></path></svg>`;
    case 'fridge':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zM5 10h14M8 6v2M8 14v4"></path></svg>`;
    case 'washing-machine':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3h14v18H5zM12 17a4 4 0 100-8 4 4 0 000 8zm-4-11h.01M10 6h.01M16 6h2"></path></svg>`;
    case 'cooker':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 4h14v16H5zM8 7h.01M12 7h.01M16 7h.01M8 11h8v6H8z"></path></svg>`;
    case 'microwave':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6h18v12H3zM6 10h8v5H6zm11-1h2M17 12h2M17 15h2"></path></svg>`;
    case 'tv':
    case 'tv-large':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`;
    case 'speaker':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L6 9z"></path></svg>`;
    case 'ac':
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6h18v6H3zm4 9l1 3m4-3l1 3m4-3l1 3"></path></svg>`;
    default:
      return `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`;
  }
}

