export const INDUSTRY_TERMS = {
  mainIndustry: 'Isolatie & Kozijnen',
  appTagline: 'Voor isolatie- en kozijnspecialisten',

  workers: {
    singular: 'Monteur',
    plural: 'Monteurs',
    specialist: 'Installateur',
  },

  companies: {
    type: 'Isolatie- en Kozijnbedrijf',
    examples: ['IsoComfort BV', 'KozijnExpert', 'WarmteWonen'],
    defaultName: 'Isolatiebedrijf',
  },

  products: {
    main: 'Isolatiematerialen & Kozijnen',
    categories: {
      insulation: 'Isolatie',
      windows: 'Kozijnen',
      doors: 'Deuren',
    },
  },

  projects: {
    types: [
      'Spouwmuurisolatie',
      'Gevelisolatie',
      'Kozijnvervanging',
      'Glas Upgrade',
      'Vloerisolatie',
      'Dakisolatie',
    ],
    defaultType: 'Isolatie & Kozijnen Project',
  },

  measurements: {
    area: 'm² te isoleren',
    quantity: 'aantal kozijnen',
    units: {
      insulation: 'm²',
      windows: 'stuks',
      doors: 'stuks',
    },
  },

  workOrders: {
    types: [
      'Isolatie Installatie',
      'Kozijn Plaatsing',
      'Glas Vervangen',
      'Opname & Meting',
      'Nazorg',
    ],
  },

  documents: {
    quoteTitle: 'OFFERTE - Isolatie & Kozijnen',
    invoiceTitle: 'FACTUUR - Isolatie & Kozijnen',
    workOrderTitle: 'WERKBON - Isolatie & Kozijnen',
  },

  marketing: {
    loginTagline: 'De slimste offerte tool voor isolatie en kozijnen professionals',
    dashboardWelcome: 'Welkom bij je isolatie en kozijnen platform',
    dashboardHero: 'Maak een foto, krijg direct een offerte voor isolatie of nieuwe kozijnen',
    onboardingWelcome: 'Welkom! Laten we je isolatie- en kozijnbedrijf opzetten',
  },

  emptyStates: {
    projects: 'Nog geen isolatie- of kozijnprojecten',
    customers: 'Nog geen klanten',
    products: 'Nog geen isolatie- of kozijnproducten',
    workOrders: 'Nog geen werkbonnen',
    invoices: 'Nog geen facturen',
  },
};

export const PRODUCT_CATEGORIES = {
  insulation_wall: { label: 'Spouwmuurisolatie', icon: 'Layers' },
  insulation_floor: { label: 'Vloerisolatie', icon: 'Layers' },
  insulation_roof: { label: 'Dakisolatie', icon: 'Layers' },
  insulation_cavity: { label: 'Spouwisolatie', icon: 'Layers' },
  window_plastic: { label: 'Kunststof Kozijn', icon: 'Frame' },
  window_aluminum: { label: 'Aluminium Kozijn', icon: 'Frame' },
  window_wood: { label: 'Houten Kozijn', icon: 'Frame' },
  door_front: { label: 'Voordeur', icon: 'DoorOpen' },
  door_back: { label: 'Achterdeur', icon: 'DoorClosed' },
  door_interior: { label: 'Binnendeur', icon: 'DoorClosed' },
};

export const DEFAULT_PRODUCTS = [
  // Isolatie producten
  {
    name: 'Glaswol Spouwmuur 10cm',
    category: 'insulation_wall',
    price: 25.5,
    unit: 'm²',
    brand: 'Rockwool',
    description: 'Hoogwaardige glaswolisolatie voor spouwmuren',
  },
  {
    name: 'PIR Isolatieplaten 12cm',
    category: 'insulation_roof',
    price: 35.0,
    unit: 'm²',
    brand: 'Kingspan',
    description: 'PIR isolatieplaten voor dakisolatie',
  },
  {
    name: 'EPS Vloerisolatie 8cm',
    category: 'insulation_floor',
    price: 18.75,
    unit: 'm²',
    brand: 'Styrodur',
    description: 'EPS isolatie voor vloeren en kruipruimtes',
  },
  {
    name: 'Steenwol Gevelisolatie 14cm',
    category: 'insulation_wall',
    price: 42.0,
    unit: 'm²',
    brand: 'Rockwool',
    description: 'Steenwol isolatie voor buitengevels',
  },

  // Kozijn producten
  {
    name: 'Kunststof Kozijn Wit HR++',
    category: 'window_plastic',
    price: 645.0,
    unit: 'stuk',
    brand: 'Deceuninck',
    description: 'Energiezuinig kunststof kozijn met HR++ glas',
  },
  {
    name: 'Kunststof Kozijn Antraciet HR++',
    category: 'window_plastic',
    price: 725.0,
    unit: 'stuk',
    brand: 'Deceuninck',
    description: 'Modern antraciet kozijn met HR++ glas',
  },
  {
    name: 'Aluminium Kozijn Grijs Triple',
    category: 'window_aluminum',
    price: 1250.0,
    unit: 'stuk',
    brand: 'Reynaers',
    description: 'Luxe aluminium kozijn met triple glas',
  },
  {
    name: 'Houten Kozijn Meranti HR++',
    category: 'window_wood',
    price: 895.0,
    unit: 'stuk',
    brand: 'TimmerfabriQ',
    description: 'Duurzaam houten kozijn van meranti hout',
  },

  // Deuren
  {
    name: 'Voordeur Kunststof Modern',
    category: 'door_front',
    price: 1850.0,
    unit: 'stuk',
    brand: 'Hörmann',
    description: 'Moderne kunststof voordeur met isolatie',
  },
  {
    name: 'Voordeur Aluminium Design',
    category: 'door_front',
    price: 2950.0,
    unit: 'stuk',
    brand: 'Schüco',
    description: 'Design aluminium voordeur met hoge isolatiewaarde',
  },
  {
    name: 'Openslaande Tuindeuren',
    category: 'door_back',
    price: 1650.0,
    unit: 'set',
    brand: 'Deceuninck',
    description: 'Kunststof openslaande deuren met HR++ glas',
  },
  {
    name: 'Binnendeur Glas Modern',
    category: 'door_interior',
    price: 385.0,
    unit: 'stuk',
    brand: 'Svedex',
    description: 'Moderne binnendeur met glaspartij',
  },
];

export const DEFAULT_PRICE_TEMPLATES = [
  {
    name: 'Spouwmuurisolatie',
    description: 'Standaard spouwmuurisolatie met glaswol',
    items: [
      { description: 'Glaswol isolatie 10cm', unit: 'm²', price: 25.5 },
      { description: 'Arbeid isolatie aanbrengen', unit: 'm²', price: 15.0 },
      { description: 'Materiaal en gereedschap', unit: 'post', price: 125.0 },
    ],
  },
  {
    name: 'Gevelisolatie',
    description: 'Buitengevel isolatie inclusief afwerking',
    items: [
      { description: 'Steenwol isolatie 14cm', unit: 'm²', price: 42.0 },
      { description: 'Arbeid montage en afwerking', unit: 'm²', price: 35.0 },
      { description: 'Stucwerk en afwerking', unit: 'm²', price: 28.0 },
    ],
  },
  {
    name: 'Vloerisolatie',
    description: 'Vloerisolatie kruipruimte of begane grond',
    items: [
      { description: 'EPS vloerisolatie 8cm', unit: 'm²', price: 18.75 },
      { description: 'Arbeid isolatie aanbrengen', unit: 'm²', price: 12.0 },
      { description: 'Extra materiaal', unit: 'post', price: 75.0 },
    ],
  },
  {
    name: 'Dakisolatie',
    description: 'Dakisolatie met PIR platen',
    items: [
      { description: 'PIR isolatieplaten 12cm', unit: 'm²', price: 35.0 },
      { description: 'Arbeid montage dakisolatie', unit: 'm²', price: 25.0 },
      { description: 'Dampremmende folie', unit: 'm²', price: 8.5 },
    ],
  },
  {
    name: 'HR++ Glas Kozijnen',
    description: 'Kunststof kozijnen met HR++ beglazing',
    items: [
      { description: 'Kunststof kozijn HR++ wit', unit: 'stuk', price: 645.0 },
      { description: 'Montage inclusief afwerking', unit: 'stuk', price: 185.0 },
      { description: 'Oud kozijn verwijderen en afvoeren', unit: 'stuk', price: 95.0 },
    ],
  },
  {
    name: 'Triple Glas Kozijnen',
    description: 'Premium aluminium kozijnen met triple glas',
    items: [
      { description: 'Aluminium kozijn triple glas', unit: 'stuk', price: 1250.0 },
      { description: 'Montage inclusief afwerking', unit: 'stuk', price: 225.0 },
      { description: 'Oud kozijn verwijderen en afvoeren', unit: 'stuk', price: 95.0 },
    ],
  },
  {
    name: 'Kunststof Kozijnen Compleet',
    description: 'Complete kozijnvervanging kunststof',
    items: [
      { description: 'Kunststof kozijn antraciet HR++', unit: 'stuk', price: 725.0 },
      { description: 'Montage inclusief afwerking', unit: 'stuk', price: 185.0 },
      { description: 'Oud kozijn verwijderen en afvoeren', unit: 'stuk', price: 95.0 },
      { description: 'Stucwerk en afwerking', unit: 'stuk', price: 125.0 },
    ],
  },
  {
    name: 'Aluminium Kozijnen Premium',
    description: 'Premium aluminium kozijnen compleet',
    items: [
      { description: 'Aluminium kozijn grijs triple', unit: 'stuk', price: 1250.0 },
      { description: 'Montage inclusief afwerking', unit: 'stuk', price: 225.0 },
      { description: 'Oud kozijn verwijderen en afvoeren', unit: 'stuk', price: 95.0 },
      { description: 'Stucwerk en schilderwerk', unit: 'stuk', price: 150.0 },
    ],
  },
];
