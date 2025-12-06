import React, { useState, useEffect } from 'react';
import { Zap, Webhook, ExternalLink, Plus, CheckCircle2, XCircle, Clock, Activity, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { getAuthorizationUrl } from '../../lib/integrations/exact-online';
import { syncCustomersToExact, syncProjectsToExact, syncCustomersFromExact } from '../../lib/integrations/sync-engine';
import { WebhookManager } from '../../components/integrations/WebhookManager';
import { ZapierInstructions } from '../../components/integrations/ZapierInstructions';

interface Integration {
  id: string;
  provider: string;
  is_connected: boolean;
  last_sync_at: string | null;
  settings: any;
}

interface SyncLog {
  id: string;
  direction: string;
  entity_type: string;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
}

export function IntegrationsUpgrade() {
  const { organization } = useOrganization();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExactModal, setShowExactModal] = useState(false);
  const [showZapierModal, setShowZapierModal] = useState(false);
  const [showWebhookManager, setShowWebhookManager] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (organization) {
      loadIntegrations();
    }
  }, [organization]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', organization!.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncLogs = async (integrationId: string) => {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('integration_id', integrationId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  };

  const handleConnectExact = () => {
    const state = crypto.randomUUID();
    localStorage.setItem('exact_oauth_state', state);

    const config = {
      clientId: 'YOUR_CLIENT_ID',
      clientSecret: 'YOUR_CLIENT_SECRET',
      redirectUri: `${window.location.origin}/api/integrations/exact-oauth-callback`,
    };

    const authUrl = getAuthorizationUrl(config, state);
    window.location.href = authUrl;
  };

  const handleSync = async (integration: Integration, entityType: 'customers' | 'projects', direction: 'push' | 'pull') => {
    setSyncing(true);
    try {
      let result;
      if (entityType === 'customers') {
        result = direction === 'push'
          ? await syncCustomersToExact(integration.id, organization!.id)
          : await syncCustomersFromExact(integration.id, organization!.id);
      } else {
        result = await syncProjectsToExact(integration.id, organization!.id);
      }

      if (result.success) {
        alert(`Sync voltooid: ${result.succeeded} van ${result.processed} records gesynchroniseerd`);
        loadSyncLogs(integration.id);
      } else {
        alert('Sync gefaald: ' + result.errors?.[0]?.error);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      alert('Fout bij synchroniseren: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Weet je zeker dat je deze integratie wilt loskoppelen?')) return;

    try {
      await supabase
        .from('integrations')
        .update({
          is_connected: false,
          access_token: null,
          refresh_token: null,
        })
        .eq('id', integrationId);

      loadIntegrations();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const exactIntegration = integrations.find((i) => i.provider === 'exact_online');

  const getTimeAgo = (date: string | null) => {
    if (!date) return 'Nooit';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Minder dan een uur geleden';
    if (hours < 24) return `${hours} uur geleden`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'dag' : 'dagen'} geleden`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Integraties & Automatisering</h2>
        <p className="text-gray-600 mt-1">Verbind BouwMeet met je favoriete tools en ERP systemen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-brand-primary rounded flex items-center justify-center text-white font-bold text-xl">
                EX
              </div>
            </div>
            {exactIntegration?.is_connected ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Verbonden
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                Niet Verbonden
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Exact Online</h3>
          <p className="text-gray-700 mb-4">
            Synchroniseer klanten, projecten en facturen naadloos met je Exact Online administratie.
          </p>

          {exactIntegration?.is_connected ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Laatst gesynchroniseerd: {getTimeAgo(exactIntegration.last_sync_at)}
              </div>
              <button
                onClick={() => setSelectedIntegration(exactIntegration)}
                className="w-full px-4 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition font-medium"
              >
                Beheren & Synchroniseren
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowExactModal(true)}
              className="w-full px-4 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition font-medium"
            >
              Verbinden met Exact Online
            </button>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-xl">
                BZ
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              Binnenkort
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Builderz</h3>
          <p className="text-gray-700 mb-4">
            Koppel met Builderz voor uitgebreide bouwproject management en planning.
          </p>

          <button
            disabled
            className="w-full px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
          >
            Binnenkort Beschikbaar
          </button>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Zap className="w-12 h-12 text-orange-500" />
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Actief
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Zapier & Webhooks</h3>
          <p className="text-gray-700 mb-4">
            Verbind met 6000+ apps via Zapier of gebruik custom webhooks voor je eigen integraties.
          </p>

          <button
            onClick={() => setShowWebhookManager(true)}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            Beheer Webhooks
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Webhook className="w-12 h-12 text-gray-600" />
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              Beschikbaar
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Custom API</h3>
          <p className="text-gray-700 mb-4">
            Bouw je eigen integratie met onze REST API en webhooks.
          </p>

          <a
            href="https://docs.bouwmeet.nl/api"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            API Documentatie
          </a>
        </div>
      </div>

      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full my-8">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Exact Online Dashboard</h3>
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Klanten</h4>
                  <p className="text-sm text-gray-600 mb-3">Synchroniseer relaties tussen systemen</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(selectedIntegration, 'customers', 'push')}
                      disabled={syncing}
                      className="flex-1 px-3 py-2 bg-brand-primary text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                    >
                      Push →
                    </button>
                    <button
                      onClick={() => handleSync(selectedIntegration, 'customers', 'pull')}
                      disabled={syncing}
                      className="flex-1 px-3 py-2 bg-brand-secondary text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                    >
                      ← Pull
                    </button>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Projecten</h4>
                  <p className="text-sm text-gray-600 mb-3">Push projecten naar Exact Online</p>
                  <button
                    onClick={() => handleSync(selectedIntegration, 'projects', 'push')}
                    disabled={syncing}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    Synchroniseren
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Verbinding</span>
                      <span className="text-brand-secondary font-medium">Actief</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Laatste sync</span>
                      <span className="text-gray-900">{getTimeAgo(selectedIntegration.last_sync_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleDisconnect(selectedIntegration.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
                >
                  Verbinding Verbreken
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verbinden met Exact Online</h3>
            <p className="text-gray-600 mb-6">
              Je wordt doorgestuurd naar Exact Online om toestemming te geven. Daarna synchroniseren we automatisch je relaties en projecten.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExactModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleConnectExact}
                className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
              >
                Doorgaan naar Exact
              </button>
            </div>
          </div>
        </div>
      )}

      {showWebhookManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Webhooks & Zapier</h3>
                <button
                  onClick={() => setShowWebhookManager(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 flex gap-4">
                <button
                  onClick={() => setShowZapierModal(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Setup Zapier
                </button>
              </div>

              <WebhookManager />
            </div>
          </div>
        </div>
      )}

      {showZapierModal && (
        <ZapierInstructions
          platform="zapier"
          onClose={() => setShowZapierModal(false)}
        />
      )}
    </div>
  );
}
