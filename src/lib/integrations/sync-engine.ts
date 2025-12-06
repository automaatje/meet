import { supabase } from '../supabase';
import {
  getExactCustomers,
  getExactProjects,
  createExactCustomer,
  createExactProject,
  getExactDivision,
  refreshAccessToken,
  isTokenExpired,
  EXACT_FIELD_MAPPINGS,
  type ExactConfig,
} from './exact-online';

interface SyncResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors?: Array<{ recordId: string; error: string }>;
}

interface Integration {
  id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  settings: any;
}

interface FieldMapping {
  source_field: string;
  target_field: string;
  transform_function?: string;
}

async function getIntegration(integrationId: string): Promise<Integration> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .single();

  if (error) throw error;
  return data;
}

async function refreshIntegrationToken(integration: Integration): Promise<void> {
  const config: ExactConfig = integration.settings;

  const tokens = await refreshAccessToken(integration.refresh_token, config);

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

  await supabase
    .from('integrations')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', integration.id);
}

async function getFieldMappings(
  integrationId: string,
  entityType: string
): Promise<FieldMapping[]> {
  const { data, error } = await supabase
    .from('field_mappings')
    .select('*')
    .eq('integration_id', integrationId)
    .eq('entity_type', entityType)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

async function ensureFieldMappings(
  integrationId: string,
  entityType: 'customers' | 'projects'
): Promise<void> {
  const { data: existing } = await supabase
    .from('field_mappings')
    .select('id')
    .eq('integration_id', integrationId)
    .eq('entity_type', entityType)
    .limit(1);

  if (existing && existing.length > 0) return;

  const defaultMappings = EXACT_FIELD_MAPPINGS[entityType];
  const mappings = Object.entries(defaultMappings).map(([source, target]) => ({
    integration_id: integrationId,
    entity_type: entityType,
    source_field: source,
    target_field: target,
    is_active: true,
  }));

  await supabase.from('field_mappings').insert(mappings);
}

function mapFields(record: any, mappings: FieldMapping[]): any {
  const mapped: any = {};

  for (const mapping of mappings) {
    const value = record[mapping.source_field];
    if (value !== undefined && value !== null) {
      mapped[mapping.target_field] = value;
    }
  }

  return mapped;
}

async function createSyncLog(log: {
  integration_id: string;
  direction: string;
  entity_type: string;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  errors?: any;
  completed_at: Date;
}): Promise<void> {
  await supabase.from('sync_logs').insert(log);
}

export async function syncCustomersToExact(
  integrationId: string,
  organizationId: string
): Promise<SyncResult> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ recordId: string; error: string }> = [];

  try {
    const integration = await getIntegration(integrationId);

    if (isTokenExpired(integration.token_expires_at)) {
      await refreshIntegrationToken(integration);
      const refreshed = await getIntegration(integrationId);
      integration.access_token = refreshed.access_token;
    }

    await ensureFieldMappings(integrationId, 'customers');
    const mappings = await getFieldMappings(integrationId, 'customers');

    const division = await getExactDivision(integration.access_token);

    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId);

    if (customerError) throw customerError;

    for (const customer of customers || []) {
      try {
        const mappedData = mapFields(customer, mappings);
        await createExactCustomer(integration.access_token, division, mappedData);
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push({ recordId: customer.id, error: error.message });
      }
      processed++;
    }

    await createSyncLog({
      integration_id: integrationId,
      direction: 'push',
      entity_type: 'customers',
      records_processed: processed,
      records_succeeded: succeeded,
      records_failed: failed,
      errors: failed > 0 ? errors : undefined,
      completed_at: new Date(),
    });

    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integrationId);

    return { success: true, processed, succeeded, failed, errors: failed > 0 ? errors : undefined };
  } catch (error: any) {
    console.error('Sync failed:', error);
    return { success: false, processed, succeeded, failed, errors: [{ recordId: 'general', error: error.message }] };
  }
}

export async function syncProjectsToExact(
  integrationId: string,
  organizationId: string
): Promise<SyncResult> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ recordId: string; error: string }> = [];

  try {
    const integration = await getIntegration(integrationId);

    if (isTokenExpired(integration.token_expires_at)) {
      await refreshIntegrationToken(integration);
      const refreshed = await getIntegration(integrationId);
      integration.access_token = refreshed.access_token;
    }

    await ensureFieldMappings(integrationId, 'projects');
    const mappings = await getFieldMappings(integrationId, 'projects');

    const division = await getExactDivision(integration.access_token);

    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId);

    if (projectError) throw projectError;

    for (const project of projects || []) {
      try {
        const mappedData = mapFields(project, mappings);
        await createExactProject(integration.access_token, division, mappedData);
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push({ recordId: project.id, error: error.message });
      }
      processed++;
    }

    await createSyncLog({
      integration_id: integrationId,
      direction: 'push',
      entity_type: 'projects',
      records_processed: processed,
      records_succeeded: succeeded,
      records_failed: failed,
      errors: failed > 0 ? errors : undefined,
      completed_at: new Date(),
    });

    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integrationId);

    return { success: true, processed, succeeded, failed, errors: failed > 0 ? errors : undefined };
  } catch (error: any) {
    console.error('Sync failed:', error);
    return { success: false, processed, succeeded, failed, errors: [{ recordId: 'general', error: error.message }] };
  }
}

export async function syncCustomersFromExact(
  integrationId: string,
  organizationId: string
): Promise<SyncResult> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ recordId: string; error: string }> = [];

  try {
    const integration = await getIntegration(integrationId);

    if (isTokenExpired(integration.token_expires_at)) {
      await refreshIntegrationToken(integration);
      const refreshed = await getIntegration(integrationId);
      integration.access_token = refreshed.access_token;
    }

    const division = await getExactDivision(integration.access_token);
    const exactCustomers = await getExactCustomers(integration.access_token, division);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    for (const exactCustomer of exactCustomers) {
      try {
        await supabase.from('customers').insert({
          organization_id: organizationId,
          user_id: user.id,
          contact_name: exactCustomer.Name,
          company_name: exactCustomer.CompanyName,
          email: exactCustomer.Email,
          phone: exactCustomer.Phone,
          address: exactCustomer.AddressLine1,
          city: exactCustomer.City,
          postal_code: exactCustomer.Postcode,
        });
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push({ recordId: exactCustomer.ID, error: error.message });
      }
      processed++;
    }

    await createSyncLog({
      integration_id: integrationId,
      direction: 'pull',
      entity_type: 'customers',
      records_processed: processed,
      records_succeeded: succeeded,
      records_failed: failed,
      errors: failed > 0 ? errors : undefined,
      completed_at: new Date(),
    });

    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integrationId);

    return { success: true, processed, succeeded, failed, errors: failed > 0 ? errors : undefined };
  } catch (error: any) {
    console.error('Sync failed:', error);
    return { success: false, processed, succeeded, failed, errors: [{ recordId: 'general', error: error.message }] };
  }
}
