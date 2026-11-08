/**
 * Catálogo de Productos — Comercial Perla de Oriente S.A. de C.V.
 * Simulación de inventario de Muebles, Línea Blanca y Tecnología.
 */

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-01',
    code: 'MUB-001',
    name: 'Juego de Sala Modular L-Shape "Milano"',
    description: 'Tapizado de lino resistente, espuma de alta densidad y estructura de pino curado.',
    category: 'Muebles',
    price: 749.00, // Precio base sin IVA
    stock: 5,
    icon: 'sofa',
    warranty: '2 años en estructura de madera'
  },
  {
    id: 'prod-02',
    code: 'MUB-002',
    name: 'Juego de Comedor 6 Puestos "Caoba Imperial"',
    description: 'Madera sólida de caoba, acabado laqueado mate con 6 sillas acolchadas en tela perla.',
    category: 'Muebles',
    price: 589.00,
    stock: 4,
    icon: 'table',
    warranty: '2 años en acabados y estructura'
  },
  {
    id: 'prod-03',
    code: 'MUB-003',
    name: 'Cama Queen Size Ortopédica "Confort Real"',
    description: 'Incluye colchón euro-top antiácaros con resortes independientes y base tapizada.',
    category: 'Muebles',
    price: 430.00,
    stock: 8,
    icon: 'bed',
    warranty: '5 años en colchón ortopédico'
  },
  {
    id: 'prod-04',
    code: 'MUB-004',
    name: 'Ropero Closet 4 Puertas con Espejo "Roble"',
    description: 'Diseño modular con 2 gaveteros interiores, colgadores de aluminio y espejo frontal.',
    category: 'Muebles',
    price: 315.00,
    stock: 6,
    icon: 'wardrobe',
    warranty: '1 año en herrajes'
  },
  {
    id: 'prod-05',
    code: 'LNB-001',
    name: 'Refrigeradora Inverter 14 Cu.Ft. No Frost Mabe',
    description: 'Ahorro de energía hasta 45%, dispensador de agua exterior y estantes de cristal templado.',
    category: 'Línea Blanca',
    price: 625.00,
    stock: 7,
    icon: 'fridge',
    warranty: '10 años en compresor, 1 año total'
  },
  {
    id: 'prod-06',
    code: 'LNB-002',
    name: 'Lavadora Carga Frontal 18 Kg Whirlpool Smart',
    description: 'Tecnología 6th Sense, vapor desinfectante y motor EcoInverter de bajo consumo acústico.',
    category: 'Línea Blanca',
    price: 699.00,
    stock: 5,
    icon: 'washing-machine',
    warranty: '10 años en motor, 1 año en componentes'
  },
  {
    id: 'prod-07',
    code: 'LNB-003',
    name: 'Cocina a Gas 6 Quemadores con Horno Panorámico',
    description: 'Encendido eléctrico, parrillas de hierro fundido y quemadores sellados triple llama.',
    category: 'Línea Blanca',
    price: 379.00,
    stock: 9,
    icon: 'cooker',
    warranty: '1 año de fábrica'
  },
  {
    id: 'prod-08',
    code: 'LNB-004',
    name: 'Microondas Grill 1.4 Cu.Ft. Panasonic Inverter',
    description: 'Cocción homogénea continua por microondas con dorador de cuarzo integrado.',
    category: 'Línea Blanca',
    price: 145.00,
    stock: 12,
    icon: 'microwave',
    warranty: '1 año de fábrica'
  },
  {
    id: 'prod-09',
    code: 'TEC-001',
    name: 'Smart TV 55" 4K UHD Samsung Crystal HDR',
    description: 'Procesador Crystal 4K, sistema Tizen con aplicaciones de streaming y control solar.',
    category: 'Tecnología',
    price: 489.00,
    stock: 10,
    icon: 'tv',
    warranty: '1 año de garantía oficial Samsung'
  },
  {
    id: 'prod-10',
    code: 'TEC-002',
    name: 'Smart TV 65" QLED 4K LG ThinQ AI',
    description: 'Color cuántico al 100%, tasa de refresco 120Hz con HDMI 2.1 para consolas de última generación.',
    category: 'Tecnología',
    price: 849.00,
    stock: 4,
    icon: 'tv-large',
    warranty: '1 año de garantía oficial LG'
  },
  {
    id: 'prod-11',
    code: 'TEC-003',
    name: 'Barra de Sonido 300W JBL con Subwoofer Inalámbrico',
    description: 'Dolby Digital integrado, conectividad Bluetooth 5.0 y entrada HDMI ARC para TV.',
    category: 'Tecnología',
    price: 195.00,
    stock: 11,
    icon: 'speaker',
    warranty: '1 año de garantía JBL'
  },
  {
    id: 'prod-12',
    code: 'TEC-004',
    name: 'Aire Acondicionado Mini Split Inverter 12,000 BTU',
    description: 'Eficiencia energética SEER 18, gas ecológico R410A y filtro antibacterial de iones.',
    category: 'Tecnología',
    price: 439.00,
    stock: 6,
    icon: 'ac',
    warranty: '5 años en compresor, 1 año en tarjeta'
  }
];

export const CATEGORIES = ['Todos', 'Muebles', 'Línea Blanca', 'Tecnología'];

