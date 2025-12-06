import { supabase } from '../supabase';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'password_changed'
  | 'user_created'
  | 'user_deleted'
  | 'user_invited'
  | 'role_changed'
  | 'customer_created'
  | 'customer_updated'
  | 'customer_deleted'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_status_changed'
  | 'quote_sent'
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_deleted'
  | 'work_order_created'
  | 'work_order_assigned'
  | 'settings_changed'
  | 'integration_connected'
  | 'integration_disconnected'
  | 'export_performed'
  | 'data_imported';

export interface AuditLogParams {
  organization_id: string;
  user_id?: string;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      ...params,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

export async function getAuditLogs(
  organizationId: string,
  filters?: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.action) {
    query = query.eq('action', filters.action);
  }

  if (filters?.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  const { data, error } = await query.limit(1000);

  if (error) throw error;
  return data;
}

export async function exportAuditLogs(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const logs = await getAuditLogs(organizationId, { startDate, endDate });

  const headers = [
    'Timestamp',
    'User',
    'Action',
    'Resource Type',
    'Resource ID',
    'IP Address',
    'User Agent',
    'Old Values',
    'New Values',
  ];

  const rows = logs.map((log) => [
    new Date(log.created_at).toLocaleString(),
    log.user_id || 'System',
    log.action,
    log.resource_type || '',
    log.resource_id || '',
    log.ip_address || '',
    log.user_agent || '',
    JSON.stringify(log.old_values || {}),
    JSON.stringify(log.new_values || {}),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export function getClientIP(): string {
  return 'client-ip';
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  login: 'Ingelogd',
  logout: 'Uitgelogd',
  login_failed: 'Login Mislukt',
  '2fa_enabled': '2FA Ingeschakeld',
  '2fa_disabled': '2FA Uitgeschakeld',
  password_changed: 'Wachtwoord Gewijzigd',
  user_created: 'Gebruiker Aangemaakt',
  user_deleted: 'Gebruiker Verwijderd',
  user_invited: 'Gebruiker Uitgenodigd',
  role_changed: 'Rol Gewijzigd',
  customer_created: 'Klant Aangemaakt',
  customer_updated: 'Klant Bijgewerkt',
  customer_deleted: 'Klant Verwijderd',
  project_created: 'Project Aangemaakt',
  project_updated: 'Project Bijgewerkt',
  project_deleted: 'Project Verwijderd',
  project_status_changed: 'Project Status Gewijzigd',
  quote_sent: 'Offerte Verstuurd',
  invoice_created: 'Factuur Aangemaakt',
  invoice_paid: 'Factuur Betaald',
  invoice_deleted: 'Factuur Verwijderd',
  work_order_created: 'Werkbon Aangemaakt',
  work_order_assigned: 'Werkbon Toegewezen',
  settings_changed: 'Instellingen Gewijzigd',
  integration_connected: 'Integratie Verbonden',
  integration_disconnected: 'Integratie Losgekoppeld',
  export_performed: 'Export Uitgevoerd',
  data_imported: 'Data Geïmporteerd',
};
