import React, { useState, useEffect } from 'react';
import { Shield, Lock, Activity, Clock, Download, AlertTriangle, CheckCircle2, Smartphone, Monitor, Globe, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAuditLogs, exportAuditLogs, ACTION_LABELS, type AuditAction } from '../../lib/security/audit';
import { getUserSessions, terminateSession, terminateAllOtherSessions, getDeviceInfo, getOperatingSystem } from '../../lib/security/session-manager';

interface SecuritySettings {
  id: string;
  require_2fa: boolean;
  allowed_ip_addresses: string[];
  session_timeout_minutes: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_number: boolean;
    require_special: boolean;
  };
}

interface AuditLog {
  id: string;
  action: AuditAction;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_id: string | null;
}

export function Security() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [showAuditDetails, setShowAuditDetails] = useState<string | null>(null);

  useEffect(() => {
    if (organization && user) {
      loadSecuritySettings();
      loadSessions();
      loadAuditLogs();
    }
  }, [organization, user]);

  const loadSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .eq('organization_id', organization!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        const defaultSettings = {
          organization_id: organization!.id,
          require_2fa: false,
          allowed_ip_addresses: [],
          session_timeout_minutes: 480,
          password_policy: {
            min_length: 8,
            require_uppercase: true,
            require_number: true,
            require_special: false,
          },
        };

        const { data: newSettings, error: createError } = await supabase
          .from('security_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await getUserSessions(user!.id);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await getAuditLogs(organization!.id, {
        action: filterAction as AuditAction | undefined,
      });
      setAuditLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const handleUpdateSettings = async (updates: Partial<SecuritySettings>) => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('security_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      alert('Beveiligingsinstellingen opgeslagen');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      alert('Fout bij opslaan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddIP = () => {
    if (!newIP.trim() || !settings) return;

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipPattern.test(newIP)) {
      alert('Ongeldig IP adres formaat. Gebruik: 192.168.1.1 of 192.168.1.0/24');
      return;
    }

    handleUpdateSettings({
      allowed_ip_addresses: [...settings.allowed_ip_addresses, newIP],
    });
    setNewIP('');
  };

  const handleRemoveIP = (ip: string) => {
    if (!settings) return;
    handleUpdateSettings({
      allowed_ip_addresses: settings.allowed_ip_addresses.filter((i) => i !== ip),
    });
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('Weet je zeker dat je deze sessie wilt beëindigen?')) return;

    try {
      await terminateSession(sessionId);
      loadSessions();
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  const handleTerminateAllOther = async () => {
    if (!confirm('Weet je zeker dat je wilt uitloggen op alle andere apparaten?')) return;

    try {
      const currentSession = sessions[0];
      if (currentSession) {
        await terminateAllOtherSessions(user!.id, currentSession.id);
        loadSessions();
        alert('Je bent uitgelogd op alle andere apparaten');
      }
    } catch (error) {
      console.error('Error terminating sessions:', error);
    }
  };

  const handleExportAuditLog = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const csv = await exportAuditLogs(organization!.id, startDate, endDate);

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting audit log:', error);
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Nu';
    if (minutes < 60) return `${minutes} min geleden`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} uur geleden`;
    const days = Math.floor(hours / 24);
    return `${days} dagen geleden`;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Beveiliging & Compliance</h2>
        <p className="text-gray-600 mt-1">Enterprise-grade beveiligingsinstellingen en audit logging</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Two-Factor Authenticatie (2FA)
        </h3>

        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">Verplicht 2FA voor alle teamleden</div>
            <div className="text-sm text-gray-600 mt-1">
              Verhoog de beveiliging door 2FA te verplichten voor iedereen
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.require_2fa || false}
              onChange={(e) => handleUpdateSettings({ require_2fa: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
          </label>
        </div>

        <button className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 flex items-center gap-2">
          <Key className="w-4 h-4" />
          Mijn 2FA Instellen
        </button>
      </div>

      {(organization?.subscription_plan === 'business' || organization?.subscription_plan === 'enterprise') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            IP Whitelisting
          </h3>

          <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Beperk toegang tot specifieke IP adressen</div>
              <div className="text-sm text-gray-600 mt-1">
                Alleen toegestane IP adressen kunnen inloggen
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={(settings?.allowed_ip_addresses?.length || 0) > 0}
                className="sr-only peer"
                disabled
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-orange-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="192.168.1.1 of 192.168.1.0/24"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={handleAddIP}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Toevoegen
              </button>
            </div>

            {settings?.allowed_ip_addresses && settings.allowed_ip_addresses.length > 0 && (
              <div className="space-y-2">
                {settings.allowed_ip_addresses.map((ip) => (
                  <div key={ip} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">{ip}</span>
                    <button
                      onClick={() => handleRemoveIP(ip)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Verwijderen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Wachtwoord Beleid
        </h3>

        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked disabled className="rounded" />
            <span className="text-sm text-gray-700">Minimaal 8 karakters (verplicht)</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings?.password_policy.require_uppercase || false}
              onChange={(e) =>
                handleUpdateSettings({
                  password_policy: {
                    ...settings!.password_policy,
                    require_uppercase: e.target.checked,
                  },
                })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700">Minimaal 1 hoofdletter</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings?.password_policy.require_number || false}
              onChange={(e) =>
                handleUpdateSettings({
                  password_policy: {
                    ...settings!.password_policy,
                    require_number: e.target.checked,
                  },
                })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700">Minimaal 1 nummer</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings?.password_policy.require_special || false}
              onChange={(e) =>
                handleUpdateSettings({
                  password_policy: {
                    ...settings!.password_policy,
                    require_special: e.target.checked,
                  },
                })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700">Minimaal 1 speciaal karakter</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Actieve Sessies ({sessions.length})
          </h3>
          {sessions.length > 1 && (
            <button
              onClick={handleTerminateAllOther}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              Uitloggen op andere apparaten
            </button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((session, index) => (
            <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {getDeviceInfo(session.user_agent || '')} op {getOperatingSystem(session.user_agent || '')}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Huidige Sessie
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  IP: {session.ip_address || 'Onbekend'} • Laatst actief: {getTimeAgo(session.last_activity_at)}
                </div>
              </div>
              {index !== 0 && (
                <button
                  onClick={() => handleTerminateSession(session.id)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Beëindigen
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sessie timeout: {settings?.session_timeout_minutes || 480} minuten
          </label>
          <input
            type="range"
            min="60"
            max="1440"
            step="60"
            value={settings?.session_timeout_minutes || 480}
            onChange={(e) => handleUpdateSettings({ session_timeout_minutes: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 uur</span>
            <span>24 uur</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Audit Trail ({auditLogs.length})
          </h3>
          <button
            onClick={handleExportAuditLog}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporteer (CSV)
          </button>
        </div>

        <div className="flex gap-3">
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              loadAuditLogs();
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Alle acties</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tijd</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Gebruiker</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actie</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">IP Adres</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditLogs.slice(0, 50).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{log.user_id ? 'Gebruiker' : 'Systeem'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {ACTION_LABELS[log.action] || log.action}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{log.ip_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
