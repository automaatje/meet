import React, { useState, useEffect } from 'react';
import { Key, Plus, MoreVertical, Trash2, Copy, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../hooks/useToast';

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
  rate_limit: number;
}

const AVAILABLE_SCOPES = [
  { group: 'Products', scopes: ['products:read', 'products:write'] },
  { group: 'Orders', scopes: ['orders:read', 'orders:write'] },
  { group: 'Customers', scopes: ['customers:read'] },
  { group: 'Projects', scopes: ['projects:read'] },
  { group: 'Webhooks', scopes: ['webhooks:manage'] },
];

export function APIKeyManager() {
  const { organization } = useOrganization();
  const { showToast } = useToast();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      loadKeys();
    }
  }, [organization]);

  const loadKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      showToast('error', 'Kon API keys niet laden');
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'bm_live_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleCreateKey = async (name: string, scopes: string[], rateLimit: number, expiresAt: string | null) => {
    try {
      const apiKey = generateAPIKey();
      const keyPrefix = apiKey.substring(0, 8);

      const { error } = await supabase
        .from('api_keys')
        .insert({
          organization_id: organization!.id,
          name,
          key_prefix: keyPrefix,
          key_hash: apiKey,
          scopes,
          rate_limit: rateLimit,
          expires_at: expiresAt,
          is_active: true,
        });

      if (error) throw error;

      setNewKeyValue(apiKey);
      setShowCreateModal(false);
      setShowNewKeyModal(true);
      await loadKeys();
      showToast('success', 'API key aangemaakt');
    } catch (error) {
      console.error('Error creating API key:', error);
      showToast('error', 'Kon API key niet aanmaken');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      await loadKeys();
      showToast('success', isActive ? 'API key gedeactiveerd' : 'API key geactiveerd');
    } catch (error) {
      console.error('Error toggling API key:', error);
      showToast('error', 'Kon status niet wijzigen');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze API key wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadKeys();
      showToast('success', 'API key verwijderd');
    } catch (error) {
      console.error('Error deleting API key:', error);
      showToast('error', 'Kon API key niet verwijderen');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('success', 'Gekopieerd naar klembord');
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nooit';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-12">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
          <p className="text-sm text-gray-600 mt-1">Beheer API keys voor externe integraties</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe API Key
        </button>
      </div>

      {keys.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Nog geen API keys aangemaakt</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-brand-primary hover:text-blue-700 font-medium"
          >
            Maak je eerste API key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`bg-white border rounded-xl p-6 ${
                !key.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{key.name}</h4>
                    {!key.is_active && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Inactief
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <code className="px-3 py-1 bg-gray-100 text-gray-800 rounded font-mono text-sm">
                      {key.key_prefix}••••••••
                    </code>
                    <button
                      onClick={() => copyToClipboard(key.key_prefix)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Kopieer prefix"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-brand-secondary" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {key.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Aangemaakt:</span> {formatDate(key.created_at)}
                    </div>
                    <div>
                      <span className="font-medium">Laatst gebruikt:</span> {formatDate(key.last_used_at)}
                    </div>
                    <div>
                      <span className="font-medium">Rate limit:</span> {key.rate_limit} req/uur
                    </div>
                    {key.expires_at && (
                      <div>
                        <span className="font-medium">Verloopt:</span> {formatDate(key.expires_at)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === key.id ? null : key.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>

                  {activeMenu === key.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                      <button
                        onClick={() => {
                          handleToggleActive(key.id, key.is_active);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        {key.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Deactiveren
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Activeren
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(key.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Verwijderen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateKey}
        />
      )}

      {showNewKeyModal && (
        <NewKeyRevealModal
          apiKey={newKeyValue}
          onClose={() => {
            setShowNewKeyModal(false);
            setNewKeyValue('');
          }}
        />
      )}
    </div>
  );
}

function CreateKeyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, scopes: string[], rateLimit: number, expiresAt: string | null) => void;
}) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [rateLimit, setRateLimit] = useState(1000);
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedScopes.length === 0) return;
    onCreate(name, selectedScopes, rateLimit, expiresAt || null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Nieuwe API Key</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Naam
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Productie API"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Scopes (Selecteer minimaal 1)
            </label>
            <div className="space-y-4">
              {AVAILABLE_SCOPES.map(({ group, scopes }) => (
                <div key={group}>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">{group}</h4>
                  <div className="space-y-2">
                    {scopes.map((scope) => (
                      <label key={scope} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope)}
                          onChange={() => toggleScope(scope)}
                          className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                        />
                        <span className="text-sm text-gray-700">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate Limit (requests per uur)
            </label>
            <input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(parseInt(e.target.value))}
              min="100"
              max="10000"
              step="100"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verloopt op (optioneel)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!name || selectedScopes.length === 0}
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              API Key Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewKeyRevealModal({ apiKey, onClose }: { apiKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h3 className="text-xl font-bold text-gray-900">API Key Aangemaakt</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium">
              Dit is de enige keer dat je deze key ziet! Kopieer en bewaar deze veilig.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Je API Key
            </label>
            <div className="flex gap-2">
              <code className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-mono text-sm break-all">
                {apiKey}
              </code>
              <button
                onClick={copyToClipboard}
                className="px-4 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Gekopieerd
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Kopieer
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Belangrijk:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>We kunnen deze key niet opnieuw tonen</li>
              <li>Bewaar de key op een veilige plek</li>
              <li>Deel de key nooit publiekelijk</li>
              <li>Als je de key kwijtraakt, maak dan een nieuwe aan</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Ik heb de key veilig opgeslagen
          </button>
        </div>
      </div>
    </div>
  );
}
