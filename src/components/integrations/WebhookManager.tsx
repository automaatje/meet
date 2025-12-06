import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Copy, Power, Eye, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableEvents, EVENT_DESCRIPTIONS } from '../../lib/webhooks/events';
import { getWebhookStats } from '../../lib/webhooks/trigger';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

interface WebhookLog {
  id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  error_message: string | null;
  created_at: string;
}

export function WebhookManager() {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [webhookStats, setWebhookStats] = useState<Record<string, any>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadWebhooks();
    }
  }, [user]);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWebhooks(data || []);

      const stats: Record<string, any> = {};
      for (const webhook of data || []) {
        stats[webhook.id] = await getWebhookStats(webhook.id);
      }
      setWebhookStats(stats);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (webhookId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: !webhook.is_active })
        .eq('id', webhook.id);

      if (error) throw error;
      await loadWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Weet je zeker dat je deze webhook wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
      await loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewLogs = (webhookId: string) => {
    setViewingLogs(webhookId);
    loadLogs(webhookId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-gray-600">Nog geen webhooks geconfigureerd</p>
        <p className="text-sm text-gray-500 mt-1">Gebruik de knoppen hierboven om een webhook toe te voegen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => {
        const stats = webhookStats[webhook.id] || { totalCalls: 0, successRate: 0 };

        return (
          <div key={webhook.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                  <button
                    onClick={() => handleToggleActive(webhook)}
                    className={`p-1 rounded ${
                      webhook.is_active
                        ? 'bg-green-100 text-brand-secondary hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={webhook.is_active ? 'Actief' : 'Inactief'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 flex-1 overflow-hidden text-ellipsis">
                    {webhook.url}
                  </code>
                  <button
                    onClick={() => handleCopyUrl(webhook.url, webhook.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Kopieer URL"
                  >
                    {copiedId === webhook.id ? (
                      <CheckCircle2 className="w-4 h-4 text-brand-secondary" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-1 ml-4">
                <button
                  onClick={() => handleViewLogs(webhook.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  title="Bekijk logs"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingWebhook(webhook)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  title="Bewerk"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(webhook.id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                  title="Verwijder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {webhook.events.map((event) => (
                <span
                  key={event}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                >
                  {EVENT_DESCRIPTIONS[event as keyof typeof EVENT_DESCRIPTIONS] || event}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                {webhook.last_triggered_at ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Laatste: {new Date(webhook.last_triggered_at).toLocaleString('nl-NL')}
                  </span>
                ) : (
                  <span className="text-gray-400">Nog niet getriggered</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${stats.successRate >= 90 ? 'text-brand-secondary' : stats.successRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.successRate}% success
                </span>
                <span className="text-gray-400">
                  ({stats.totalCalls} calls)
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {viewingLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Webhook Logs</h3>
              <button
                onClick={() => setViewingLogs(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Geen logs gevonden
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border ${
                        log.response_status && log.response_status >= 200 && log.response_status < 300
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.response_status && log.response_status >= 200 && log.response_status < 300 ? (
                            <CheckCircle2 className="w-5 h-5 text-brand-secondary" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            {EVENT_DESCRIPTIONS[log.event_type as keyof typeof EVENT_DESCRIPTIONS] || log.event_type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString('nl-NL')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`font-medium ${log.response_status && log.response_status >= 200 && log.response_status < 300 ? 'text-green-700' : 'text-red-700'}`}>
                          Status: {log.response_status || 'Failed'}
                        </span>
                        {log.error_message && (
                          <span className="text-red-700">
                            {log.error_message}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
