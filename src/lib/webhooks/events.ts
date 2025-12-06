export const WEBHOOK_EVENTS = {
  CUSTOMER_CREATED: 'customer.created',
  PROJECT_CREATED: 'project.created',
  PROJECT_WON: 'project.won',
  QUOTE_SENT: 'quote.sent',
  WORK_ORDER_COMPLETED: 'work_order.completed',
  INVOICE_PAID: 'invoice.paid',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

export const EVENT_DESCRIPTIONS: Record<WebhookEventType, string> = {
  [WEBHOOK_EVENTS.CUSTOMER_CREATED]: 'Nieuwe klant aangemaakt',
  [WEBHOOK_EVENTS.PROJECT_CREATED]: 'Nieuw project aangemaakt',
  [WEBHOOK_EVENTS.PROJECT_WON]: 'Project status gewijzigd naar Gewonnen',
  [WEBHOOK_EVENTS.QUOTE_SENT]: 'Offerte verstuurd',
  [WEBHOOK_EVENTS.WORK_ORDER_COMPLETED]: 'Werkbon voltooid',
  [WEBHOOK_EVENTS.INVOICE_PAID]: 'Factuur betaald',
};

interface CustomerData {
  id: string;
  contact_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  created_at: string;
}

interface ProjectData {
  id: string;
  project_number: string;
  title: string;
  status: string;
  quote_amount?: number;
  start_date?: string;
  created_at: string;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  issue_date: string;
  paid_at?: string;
}

interface WorkOrderData {
  id: string;
  work_order_number: string;
  title: string;
  status: string;
  completed_date?: string;
}

export const EventPayloads = {
  [WEBHOOK_EVENTS.CUSTOMER_CREATED]: (customer: CustomerData) => ({
    id: customer.id,
    name: customer.contact_name,
    company: customer.company_name || null,
    email: customer.email,
    phone: customer.phone || null,
    address: {
      street: customer.address || null,
      postal_code: customer.postal_code || null,
      city: customer.city || null,
    },
    created_at: customer.created_at,
  }),

  [WEBHOOK_EVENTS.PROJECT_CREATED]: (project: ProjectData, customer: CustomerData) => ({
    id: project.id,
    project_number: project.project_number,
    title: project.title,
    status: project.status,
    customer: {
      id: customer.id,
      name: customer.contact_name,
      company: customer.company_name || null,
    },
    quote_amount: project.quote_amount || null,
    start_date: project.start_date || null,
    created_at: project.created_at,
  }),

  [WEBHOOK_EVENTS.PROJECT_WON]: (project: ProjectData, customer: CustomerData) => ({
    id: project.id,
    project_number: project.project_number,
    title: project.title,
    customer: {
      id: customer.id,
      name: customer.contact_name,
      company: customer.company_name || null,
      email: customer.email,
    },
    value: project.quote_amount || 0,
    won_at: new Date().toISOString(),
  }),

  [WEBHOOK_EVENTS.QUOTE_SENT]: (project: ProjectData, customer: CustomerData) => ({
    id: project.id,
    project_number: project.project_number,
    title: project.title,
    customer: {
      id: customer.id,
      name: customer.contact_name,
      company: customer.company_name || null,
      email: customer.email,
    },
    quote_amount: project.quote_amount || 0,
    sent_at: new Date().toISOString(),
  }),

  [WEBHOOK_EVENTS.WORK_ORDER_COMPLETED]: (
    workOrder: WorkOrderData,
    project: ProjectData,
    customer: CustomerData
  ) => ({
    id: workOrder.id,
    work_order_number: workOrder.work_order_number,
    title: workOrder.title,
    project: {
      id: project.id,
      project_number: project.project_number,
      title: project.title,
    },
    customer: {
      id: customer.id,
      name: customer.contact_name,
      company: customer.company_name || null,
    },
    completed_at: workOrder.completed_date || new Date().toISOString(),
  }),

  [WEBHOOK_EVENTS.INVOICE_PAID]: (invoice: InvoiceData, customer: CustomerData) => ({
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer: {
      id: customer.id,
      name: customer.contact_name,
      company: customer.company_name || null,
      email: customer.email,
    },
    amount: invoice.total,
    issue_date: invoice.issue_date,
    paid_at: invoice.paid_at || new Date().toISOString(),
  }),
};

export function getAvailableEvents(): Array<{ value: WebhookEventType; label: string }> {
  return Object.entries(EVENT_DESCRIPTIONS).map(([value, label]) => ({
    value: value as WebhookEventType,
    label,
  }));
}
