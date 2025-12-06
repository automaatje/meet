export interface FieldMapping {
  sourceField: string;
  targetField: string;
  description?: string;
}

export interface MappingPreset {
  id: string;
  name: string;
  description: string;
  mapping: Record<string, string>;
}

export const customerFieldsAvailable: FieldMapping[] = [
  { sourceField: 'contact_name', targetField: 'Contactpersoon', description: 'Naam contactpersoon' },
  { sourceField: 'company_name', targetField: 'Bedrijfsnaam', description: 'Naam bedrijf' },
  { sourceField: 'email', targetField: 'E-mail', description: 'E-mailadres' },
  { sourceField: 'phone', targetField: 'Telefoon', description: 'Telefoonnummer' },
  { sourceField: 'address', targetField: 'Adres', description: 'Straat en huisnummer' },
  { sourceField: 'postal_code', targetField: 'Postcode', description: 'Postcode' },
  { sourceField: 'city', targetField: 'Plaats', description: 'Woonplaats' },
  { sourceField: 'notes', targetField: 'Notities', description: 'Extra notities' },
  { sourceField: 'created_at', targetField: 'Aangemaakt op', description: 'Datum aangemaakt' },
];

export const projectFieldsAvailable: FieldMapping[] = [
  { sourceField: 'project_number', targetField: 'Projectnummer', description: 'Uniek projectnummer' },
  { sourceField: 'title', targetField: 'Titel', description: 'Projecttitel' },
  { sourceField: 'customer.contact_name', targetField: 'Klant', description: 'Klantnaam' },
  { sourceField: 'customer.company_name', targetField: 'Bedrijf', description: 'Bedrijfsnaam klant' },
  { sourceField: 'status', targetField: 'Status', description: 'Projectstatus' },
  { sourceField: 'address', targetField: 'Projectadres', description: 'Locatie project' },
  { sourceField: 'postal_code', targetField: 'Postcode', description: 'Postcode project' },
  { sourceField: 'city', targetField: 'Plaats', description: 'Plaats project' },
  { sourceField: 'quote_amount', targetField: 'Offertebedrag', description: 'Geoffreerd bedrag' },
  { sourceField: 'actual_costs', targetField: 'Werkelijke kosten', description: 'Gemaakte kosten' },
  { sourceField: 'start_date', targetField: 'Startdatum', description: 'Geplande start' },
  { sourceField: 'completion_date', targetField: 'Opleverdatum', description: 'Geplande oplevering' },
  { sourceField: 'notes', targetField: 'Notities', description: 'Projectnotities' },
  { sourceField: 'created_at', targetField: 'Aangemaakt op', description: 'Datum aangemaakt' },
];

export const invoiceFieldsAvailable: FieldMapping[] = [
  { sourceField: 'invoice_number', targetField: 'Factuurnummer', description: 'Uniek factuurnummer' },
  { sourceField: 'customer.contact_name', targetField: 'Klant', description: 'Klantnaam' },
  { sourceField: 'customer.company_name', targetField: 'Bedrijf', description: 'Bedrijfsnaam' },
  { sourceField: 'project.project_number', targetField: 'Projectnummer', description: 'Gekoppeld project' },
  { sourceField: 'project.title', targetField: 'Projectnaam', description: 'Naam project' },
  { sourceField: 'status', targetField: 'Status', description: 'Factuurstatus' },
  { sourceField: 'issue_date', targetField: 'Factuurdatum', description: 'Datum factuur' },
  { sourceField: 'due_date', targetField: 'Vervaldatum', description: 'Betaaltermijn' },
  { sourceField: 'subtotal', targetField: 'Subtotaal', description: 'Bedrag excl. BTW' },
  { sourceField: 'vat_amount', targetField: 'BTW bedrag', description: 'BTW' },
  { sourceField: 'total', targetField: 'Totaal', description: 'Bedrag incl. BTW' },
  { sourceField: 'paid_amount', targetField: 'Betaald', description: 'Betaald bedrag' },
  { sourceField: 'notes', targetField: 'Notities', description: 'Factuurnotities' },
  { sourceField: 'created_at', targetField: 'Aangemaakt op', description: 'Datum aangemaakt' },
];

export const customerMappingPresets: MappingPreset[] = [
  {
    id: 'standard',
    name: 'Standaard CSV',
    description: 'Basis exportformat met alle velden',
    mapping: {
      'contact_name': 'Contactpersoon',
      'company_name': 'Bedrijfsnaam',
      'email': 'E-mail',
      'phone': 'Telefoon',
      'address': 'Adres',
      'postal_code': 'Postcode',
      'city': 'Plaats',
      'notes': 'Notities',
    }
  },
  {
    id: 'exact-online',
    name: 'Exact Online Relaties',
    description: 'Importeer in Exact Online als relatiebestand',
    mapping: {
      'contact_name': 'Naam',
      'company_name': 'Bedrijfsnaam',
      'email': 'E-mail',
      'phone': 'Telefoon',
      'address': 'Bezoekadres',
      'postal_code': 'Postcode',
      'city': 'Plaats',
    }
  },
  {
    id: 'builderz',
    name: 'Builderz Format',
    description: 'Compatibel met Builderz CRM',
    mapping: {
      'company_name': 'Bedrijf',
      'contact_name': 'Contact',
      'email': 'Email',
      'phone': 'Telefoon',
      'address': 'Straat',
      'postal_code': 'Postcode',
      'city': 'Stad',
    }
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Salesforce Account import format',
    mapping: {
      'company_name': 'Account Name',
      'contact_name': 'Primary Contact',
      'phone': 'Phone',
      'email': 'Email',
      'address': 'Billing Street',
      'postal_code': 'Billing Postal Code',
      'city': 'Billing City',
    }
  }
];

export const projectMappingPresets: MappingPreset[] = [
  {
    id: 'standard',
    name: 'Standaard CSV',
    description: 'Basis projectexport',
    mapping: {
      'project_number': 'Projectnummer',
      'title': 'Titel',
      'customer.contact_name': 'Klant',
      'status': 'Status',
      'address': 'Adres',
      'quote_amount': 'Offertebedrag',
      'actual_costs': 'Werkelijke kosten',
      'start_date': 'Startdatum',
      'completion_date': 'Opleverdatum',
    }
  },
  {
    id: 'exact-online',
    name: 'Exact Online Projecten',
    description: 'Voor import in Exact Online',
    mapping: {
      'project_number': 'Code',
      'title': 'Omschrijving',
      'customer.company_name': 'Relatie',
      'status': 'Status',
      'start_date': 'Startdatum',
      'completion_date': 'Einddatum',
    }
  },
  {
    id: 'builderz',
    name: 'Builderz Format',
    description: 'Compatibel met Builderz',
    mapping: {
      'project_number': 'Project ID',
      'title': 'Project',
      'customer.contact_name': 'Klant',
      'address': 'Locatie',
      'status': 'Status',
      'quote_amount': 'Budget',
    }
  }
];

export const invoiceMappingPresets: MappingPreset[] = [
  {
    id: 'standard',
    name: 'Standaard CSV',
    description: 'Basis factuurexport',
    mapping: {
      'invoice_number': 'Factuurnummer',
      'customer.contact_name': 'Klant',
      'project.title': 'Project',
      'status': 'Status',
      'issue_date': 'Factuurdatum',
      'due_date': 'Vervaldatum',
      'total': 'Totaalbedrag',
      'paid_amount': 'Betaald',
    }
  },
  {
    id: 'exact-online',
    name: 'Exact Online Facturen',
    description: 'Voor import in Exact Online',
    mapping: {
      'invoice_number': 'Factuurnummer',
      'customer.company_name': 'Relatiecode',
      'issue_date': 'Factuurdatum',
      'due_date': 'Vervaldatum',
      'subtotal': 'Bedrag excl. BTW',
      'vat_amount': 'BTW',
      'total': 'Bedrag incl. BTW',
    }
  },
  {
    id: 'twinfield',
    name: 'Twinfield',
    description: 'Voor import in Twinfield',
    mapping: {
      'invoice_number': 'Factuurnummer',
      'customer.company_name': 'Debiteur',
      'issue_date': 'Datum',
      'due_date': 'Vervaldatum',
      'total': 'Bedrag',
      'status': 'Status',
    }
  }
];

export function getFieldsForEntity(entity: 'customers' | 'projects' | 'invoices'): FieldMapping[] {
  switch (entity) {
    case 'customers':
      return customerFieldsAvailable;
    case 'projects':
      return projectFieldsAvailable;
    case 'invoices':
      return invoiceFieldsAvailable;
    default:
      return [];
  }
}

export function getPresetsForEntity(entity: 'customers' | 'projects' | 'invoices'): MappingPreset[] {
  switch (entity) {
    case 'customers':
      return customerMappingPresets;
    case 'projects':
      return projectMappingPresets;
    case 'invoices':
      return invoiceMappingPresets;
    default:
      return [];
  }
}

export function saveCustomMapping(entity: string, name: string, mapping: Record<string, string>): void {
  const key = `custom_mappings_${entity}`;
  const existing = localStorage.getItem(key);
  const mappings = existing ? JSON.parse(existing) : [];

  mappings.push({
    id: `custom_${Date.now()}`,
    name,
    description: 'Aangepaste mapping',
    mapping
  });

  localStorage.setItem(key, JSON.stringify(mappings));
}

export function getCustomMappings(entity: string): MappingPreset[] {
  const key = `custom_mappings_${entity}`;
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}

export function deleteCustomMapping(entity: string, id: string): void {
  const key = `custom_mappings_${entity}`;
  const existing = localStorage.getItem(key);
  if (!existing) return;

  const mappings = JSON.parse(existing);
  const filtered = mappings.filter((m: MappingPreset) => m.id !== id);
  localStorage.setItem(key, JSON.stringify(filtered));
}
