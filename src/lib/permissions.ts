export type Role =
  | 'owner'
  | 'admin'
  | 'head_of_sales'
  | 'sales_manager'
  | 'account_manager_field'
  | 'commercial_inside'
  | 'field_marketeer'
  | 'employee'
  | 'viewer';

export type TestRole =
  | 'head_of_sales_test'
  | 'sales_manager_test'
  | 'account_manager_field_test'
  | 'commercial_inside_test'
  | 'field_marketeer_test'
  | 'employee_test'
  | 'viewer_test';

export type RoleOrTestRole = Role | TestRole;

export function isTestRole(role: string): role is TestRole {
  return role.endsWith('_test');
}

export function getBaseRole(role: RoleOrTestRole): Role {
  if (isTestRole(role)) {
    return role.replace('_test', '') as Role;
  }
  return role as Role;
}

export function canSwitchToTestMode(currentRole: Role): boolean {
  return currentRole === 'owner' || currentRole === 'admin';
}

export const TEST_ROLES: TestRole[] = [
  'head_of_sales_test',
  'sales_manager_test',
  'account_manager_field_test',
  'commercial_inside_test',
  'field_marketeer_test',
  'employee_test',
  'viewer_test',
];

export type Permission = 'create' | 'read' | 'update' | 'delete';
export type ReadScope = boolean | 'own' | 'team' | 'all' | 'own_performance' | 'marketing';
export type ManageScope = boolean | 'team' | 'all';

export interface ResourcePermissions {
  create: boolean;
  read: ReadScope;
  update: ReadScope;
  delete: boolean;
}

export interface Permissions {
  leads?: ResourcePermissions;
  customers: ResourcePermissions;
  projects: ResourcePermissions;
  quotes: ResourcePermissions;
  invoices: ResourcePermissions;
  work_orders: ResourcePermissions;
  visualizations?: ResourcePermissions;
  team: {
    read: ReadScope;
    invite: boolean;
    manage: ManageScope;
  };
  settings: {
    read: boolean;
    update: boolean | 'team_settings' | 'all';
  };
  webhooks: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  reports?: {
    read: ReadScope;
    export: boolean;
  };
  campaigns?: {
    create: boolean;
    read: ReadScope;
    update: ReadScope;
    delete: boolean;
  };
  targets?: {
    create: boolean;
    read: ReadScope;
    update: ReadScope;
    delete: boolean;
  };
  strategy?: {
    read: boolean;
    update: boolean;
  };
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Volledige controle, kan alles beheren en andere owners aanwijzen',
  admin: 'Kan alles beheren behalve billing en owners',
  head_of_sales: 'Commercieel directeur met volledige sales oversight',
  sales_manager: 'Team lead die meerdere verkopers aanstuurt',
  account_manager_field: 'Verkopers/vertegenwoordigers die klanten bezoeken en deals sluiten',
  commercial_inside: 'Binnendienst die offertes uitwerkt en follow-up doet',
  field_marketeer: 'Marketing op locatie, events en lead kwalificatie',
  employee: 'Kan eigen werk beheren en klanten bekijken',
  viewer: 'Alleen lezen toegang tot alles',
};

export const ROLE_COLORS: Record<Role, { bg: string; text: string; label: string }> = {
  owner: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Eigenaar' },
  admin: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Beheerder' },
  head_of_sales: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Head of Sales' },
  sales_manager: { bg: 'bg-green-100', text: 'text-green-700', label: 'Sales Manager' },
  account_manager_field: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Accountmanager Buitendienst',
  },
  commercial_inside: {
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    label: 'Commercieel Binnendienst',
  },
  field_marketeer: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Field Marketeer' },
  employee: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Medewerker' },
  viewer: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Alleen Lezen' },
};

export const TEST_ROLE_COLORS: Record<TestRole, { bg: string; text: string; label: string }> = {
  head_of_sales_test: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Head of Sales (Test)' },
  sales_manager_test: { bg: 'bg-green-50', text: 'text-green-600', label: 'Sales Manager (Test)' },
  account_manager_field_test: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    label: 'Accountmanager Buitendienst (Test)',
  },
  commercial_inside_test: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    label: 'Commercieel Binnendienst (Test)',
  },
  field_marketeer_test: { bg: 'bg-pink-50', text: 'text-pink-600', label: 'Field Marketeer (Test)' },
  employee_test: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'Medewerker (Test)' },
  viewer_test: { bg: 'bg-slate-50', text: 'text-slate-600', label: 'Alleen Lezen (Test)' },
};

export function getRoleColor(role: RoleOrTestRole): { bg: string; text: string; label: string } {
  if (isTestRole(role)) {
    return TEST_ROLE_COLORS[role];
  }
  return ROLE_COLORS[role as Role];
}

export const ROLE_ONBOARDING: Record<
  Role,
  { welcome: string; features: string[]; steps: string[] }
> = {
  owner: {
    welcome: 'Welkom eigenaar! Je hebt volledige controle over de organisatie.',
    features: ['Volledige toegang tot alle functies', 'Facturatie en billing beheer', 'Team management'],
    steps: ['Stel je bedrijfsgegevens in', 'Nodig teamleden uit', 'Configureer integraties'],
  },
  admin: {
    welcome: 'Welkom beheerder! Je kunt bijna alles beheren.',
    features: ['Volledige toegang tot alle functies', 'Team management', 'Systeem instellingen'],
    steps: ['Bekijk je dashboard', 'Beheer team leden', 'Stel workflows in'],
  },
  head_of_sales: {
    welcome: 'Welkom Head of Sales! Je hebt volledige commerciële oversight.',
    features: [
      'Executive dashboard met company-wide metrics',
      'Volledige team oversight',
      'Strategic planning tools',
      'Budget tracking',
    ],
    steps: [
      'Bekijk je executive dashboard',
      'Review team performance',
      'Stel sales targets in',
      'Analyseer win/loss ratio',
    ],
  },
  sales_manager: {
    welcome: 'Welkom Sales Manager! Je stuurt je sales team aan.',
    features: [
      'Team performance dashboard',
      'Deal approval workflow',
      'Territory management',
      'Sales coaching tools',
    ],
    steps: [
      'Bekijk je team dashboard',
      'Wijs territories toe',
      'Review pending deals',
      'Stel team targets in',
    ],
  },
  account_manager_field: {
    welcome: 'Welkom Accountmanager! Als buitendienstmedewerker krijg je toegang tot:',
    features: [
      'Mobiele app voor onderweg',
      'Lead creation en eigen pipeline',
      'Snelle offerte generator',
      'Route planning voor klantbezoeken',
    ],
    steps: [
      'Download de mobiele app',
      'Voeg je eerste lead toe',
      'Plan je eerste klantbezoek',
      'Maak je eerste offerte',
    ],
  },
  commercial_inside: {
    welcome: 'Welkom Commercieel Medewerker Binnendienst!',
    features: [
      'Lead assignment inbox',
      'Follow-up dashboard met reminders',
      'Email templates',
      'Bulk quote generation',
    ],
    steps: [
      'Bekijk je lead inbox',
      'Neem eerste lead in behandeling',
      'Stel follow-up reminders in',
      'Maak je eerste offerte',
    ],
  },
  field_marketeer: {
    welcome: 'Welkom Field Marketeer!',
    features: [
      'Campagne tracking per regio',
      'Event lead capture',
      'Lead qualification forms',
      'Regional performance dashboard',
    ],
    steps: [
      'Maak je eerste campagne aan',
      'Scan QR code voor lead capture',
      'Kwalificeer leads',
      'Bekijk campagne performance',
    ],
  },
  employee: {
    welcome: 'Welkom medewerker!',
    features: ['Eigen werk beheren', 'Klanten bekijken', 'Werkbonnen invullen'],
    steps: ['Bekijk je werkbonnen', 'Registreer tijden', 'Update project status'],
  },
  viewer: {
    welcome: 'Welkom! Je hebt leestoegang tot de organisatie.',
    features: ['Bekijk alle projecten', 'Bekijk klanten', 'Bekijk offertes'],
    steps: ['Verken het dashboard', 'Bekijk lopende projecten'],
  },
};

const allPermissions: ResourcePermissions = {
  create: true,
  read: 'all',
  update: 'all',
  delete: true,
};

const readOnlyPermissions: ResourcePermissions = {
  create: false,
  read: 'all',
  update: false,
  delete: false,
};

const readWritePermissions: ResourcePermissions = {
  create: true,
  read: 'all',
  update: 'all',
  delete: false,
};

const ownPermissions: ResourcePermissions = {
  create: true,
  read: 'own',
  update: 'own',
  delete: false,
};

const teamPermissions: ResourcePermissions = {
  create: true,
  read: 'team',
  update: 'team',
  delete: false,
};

export const DEFAULT_PERMISSIONS: Record<Role, Permissions> = {
  owner: {
    leads: allPermissions,
    customers: allPermissions,
    projects: allPermissions,
    quotes: allPermissions,
    invoices: allPermissions,
    work_orders: allPermissions,
    visualizations: allPermissions,
    team: { read: 'all', invite: true, manage: 'all' },
    settings: { read: true, update: 'all' },
    webhooks: { create: true, read: true, update: true, delete: true },
    reports: { read: 'all', export: true },
    campaigns: allPermissions,
    targets: allPermissions,
    strategy: { read: true, update: true },
  },
  admin: {
    leads: allPermissions,
    customers: allPermissions,
    projects: allPermissions,
    quotes: allPermissions,
    invoices: allPermissions,
    work_orders: allPermissions,
    visualizations: allPermissions,
    team: { read: 'all', invite: true, manage: 'all' },
    settings: { read: true, update: true },
    webhooks: { create: true, read: true, update: true, delete: true },
    reports: { read: 'all', export: true },
    campaigns: allPermissions,
    targets: allPermissions,
    strategy: { read: true, update: false },
  },
  head_of_sales: {
    leads: allPermissions,
    customers: allPermissions,
    projects: allPermissions,
    quotes: allPermissions,
    invoices: allPermissions,
    work_orders: allPermissions,
    visualizations: allPermissions,
    team: { read: 'all', invite: true, manage: 'all' },
    settings: { read: true, update: 'all' },
    webhooks: { create: true, read: true, update: true, delete: false },
    reports: { read: 'all', export: true },
    campaigns: allPermissions,
    targets: allPermissions,
    strategy: { read: true, update: true },
  },
  sales_manager: {
    leads: allPermissions,
    customers: allPermissions,
    projects: allPermissions,
    quotes: allPermissions,
    invoices: readWritePermissions,
    work_orders: readWritePermissions,
    visualizations: allPermissions,
    team: { read: 'team', invite: true, manage: 'team' },
    settings: { read: true, update: 'team_settings' },
    webhooks: { create: false, read: true, update: false, delete: false },
    reports: { read: 'all', export: true },
    campaigns: readWritePermissions,
    targets: { create: true, read: 'team', update: 'team', delete: false },
    strategy: { read: false, update: false },
  },
  account_manager_field: {
    leads: ownPermissions,
    customers: ownPermissions,
    projects: ownPermissions,
    quotes: ownPermissions,
    invoices: { create: false, read: 'own', update: false, delete: false },
    work_orders: ownPermissions,
    visualizations: ownPermissions,
    team: { read: false, invite: false, manage: false },
    settings: { read: false, update: false },
    webhooks: { create: false, read: false, update: false, delete: false },
    reports: { read: 'own_performance', export: false },
    campaigns: { create: false, read: 'all', update: false, delete: false },
    targets: { create: false, read: 'own', update: false, delete: false },
    strategy: { read: false, update: false },
  },
  commercial_inside: {
    leads: teamPermissions,
    customers: allPermissions,
    projects: { create: false, read: 'all', update: 'team', delete: false },
    quotes: allPermissions,
    invoices: allPermissions,
    work_orders: teamPermissions,
    visualizations: allPermissions,
    team: { read: 'team', invite: false, manage: false },
    settings: { read: true, update: false },
    webhooks: { create: false, read: false, update: false, delete: false },
    reports: { read: 'team', export: true },
    campaigns: { create: false, read: 'all', update: false, delete: false },
    targets: { create: false, read: 'team', update: false, delete: false },
    strategy: { read: false, update: false },
  },
  field_marketeer: {
    leads: { create: true, read: 'all', update: 'own', delete: false },
    customers: { create: true, read: 'all', update: false, delete: false },
    projects: { create: false, read: 'all', update: false, delete: false },
    quotes: { create: false, read: false, update: false, delete: false },
    invoices: { create: false, read: false, update: false, delete: false },
    work_orders: { create: false, read: false, update: false, delete: false },
    visualizations: { create: false, read: false, update: false, delete: false },
    team: { read: 'team', invite: false, manage: false },
    settings: { read: true, update: false },
    webhooks: { create: false, read: false, update: false, delete: false },
    reports: { read: 'marketing', export: true },
    campaigns: allPermissions,
    targets: { create: false, read: 'own', update: false, delete: false },
    strategy: { read: false, update: false },
  },
  employee: {
    leads: { create: false, read: false, update: false, delete: false },
    customers: readOnlyPermissions,
    projects: readOnlyPermissions,
    quotes: readOnlyPermissions,
    invoices: readOnlyPermissions,
    work_orders: readWritePermissions,
    visualizations: readOnlyPermissions,
    team: { read: false, invite: false, manage: false },
    settings: { read: false, update: false },
    webhooks: { create: false, read: false, update: false, delete: false },
    reports: { read: 'own', export: false },
    campaigns: { create: false, read: false, update: false, delete: false },
    targets: { create: false, read: false, update: false, delete: false },
    strategy: { read: false, update: false },
  },
  viewer: {
    leads: { create: false, read: 'all', update: false, delete: false },
    customers: readOnlyPermissions,
    projects: readOnlyPermissions,
    quotes: readOnlyPermissions,
    invoices: readOnlyPermissions,
    work_orders: readOnlyPermissions,
    visualizations: readOnlyPermissions,
    team: { read: false, invite: false, manage: false },
    settings: { read: false, update: false },
    webhooks: { create: false, read: false, update: false, delete: false },
    reports: { read: false, export: false },
    campaigns: { create: false, read: false, update: false, delete: false },
    targets: { create: false, read: false, update: false, delete: false },
    strategy: { read: false, update: false },
  },
};

export function getPermissions(role: Role, customPermissions?: Partial<Permissions>): Permissions {
  const defaultPerms = DEFAULT_PERMISSIONS[role];
  if (!customPermissions) return defaultPerms;

  return {
    ...defaultPerms,
    ...customPermissions,
  } as Permissions;
}

export function canPerform(
  permissions: Permissions,
  resource: keyof Permissions,
  action: string
): boolean {
  const resourcePerms = permissions[resource];
  if (!resourcePerms) return false;

  if (typeof resourcePerms === 'object' && action in resourcePerms) {
    const value = resourcePerms[action as keyof typeof resourcePerms];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value !== false;
  }

  return false;
}

export function getReadScope(permissions: Permissions, resource: keyof Permissions): ReadScope {
  const resourcePerms = permissions[resource];
  if (!resourcePerms) return false;

  if (typeof resourcePerms === 'object' && 'read' in resourcePerms) {
    return resourcePerms.read;
  }

  return false;
}
