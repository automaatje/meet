import React, { useState } from 'react';
import { X, Copy, CheckCircle2, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableEvents } from '../../lib/webhooks/events';
import { testWebhook } from '../../lib/webhooks/trigger';

interface ZapierInstructionsProps {
  onClose: () => void;
  platform: 'zapier' | 'make';
}

export function ZapierInstructions({ onClose, platform }: ZapierInstructionsProps) {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookName, setWebhookName] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const availableEvents = getAvailableEvents();

  const instructions = platform === 'zapier'
    ? {
        title: 'Zapier Setup',
        logo: '⚡',
        steps: [
          'Ga naar Zapier.com en maak een account aan (of log in)',
          'Klik op "Make a Zap"',
          'Zoek naar "Webhooks by Zapier" als trigger app',
          'Kies "Catch Hook" als trigger event',
          'Kopieer de webhook URL die Zapier je geeft',
          'Plak deze URL hieronder en kies welke events je wilt ontvangen',
        ],
        link: 'https://zapier.com/apps/webhook/integrations',
      }
    : {
        title: 'Make.com Setup',
        logo: '🔷',
        steps: [
          'Ga naar Make.com en maak een account aan (of log in)',
          'Maak een nieuw scenario',
          'Kies "HTTP" module als eerste stap',
          'Selecteer "Make a request"',
          'Kies "POST" als method',
          'Kopieer de webhook URL die Make je geeft',
          'Plak deze URL hieronder en kies welke events je wilt ontvangen',
        ],
        link: 'https://www.make.com/en/integrations/webhook',
      };

  const handleCopyExample = () => {
    const exampleUrl = platform === 'zapier'
      ? 'https://hooks.zapier.com/hooks/catch/1234567/abcdefg/'
      : 'https://hook.eu1.make.com/abcdefgh12345678';

    navigator.clipboard.writeText(exampleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEventToggle = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleTest = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({ success: false, message: 'Voer eerst een webhook URL in' });
      return;
    }

    if (!webhookUrl.startsWith('https://')) {
      setTestResult({ success: false, message: 'Webhook URL moet beginnen met https://' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const tempId = 'test-' + Date.now();
      const result = await testWebhook(tempId, webhookUrl);

      if (result.success) {
        setTestResult({
          success: true,
          message: `Test succesvol! Status: ${result.status}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Test gefaald: ${result.error || 'Onbekende fout'}`,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Fout: ${error.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!webhookUrl.trim() || !webhookName.trim() || selectedEvents.length === 0) {
      alert('Vul alle velden in en selecteer minimaal één event');
      return;
    }

    if (!webhookUrl.startsWith('https://')) {
      alert('Webhook URL moet beginnen met https://');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('webhooks').insert({
        user_id: user!.id,
        name: webhookName,
        url: webhookUrl,
        events: selectedEvents,
        is_active: true,
      });

      if (error) throw error;

      alert('Webhook succesvol aangemaakt!');
      onClose();
    } catch (error: any) {
      console.error('Error saving webhook:', error);
      alert('Fout bij opslaan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{instructions.logo}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{instructions.title}</h2>
              <p className="text-sm text-gray-600">Verbind BouwMeet met {platform === 'zapier' ? 'Zapier' : 'Make.com'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-primary" />
              Stap voor stap instructies
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <a
              href={instructions.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-brand-primary hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              Open {platform === 'zapier' ? 'Zapier' : 'Make.com'}
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Naam
            </label>
            <input
              type="text"
              value={webhookName}
              onChange={(e) => setWebhookName(e.target.value)}
              placeholder={`Mijn ${platform === 'zapier' ? 'Zapier' : 'Make.com'} Integratie`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <button
                onClick={handleCopyExample}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                title="Kopieer voorbeeld URL"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-brand-secondary" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Plak hier de webhook URL die {platform === 'zapier' ? 'Zapier' : 'Make.com'} je geeft
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecteer Events
            </label>
            <div className="space-y-2">
              {availableEvents.map((event) => (
                <label
                  key={event.value}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.value)}
                    onChange={() => handleEventToggle(event.value)}
                    className="w-4 h-4 text-brand-primary"
                  />
                  <span className="text-sm text-gray-900">{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                testResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleTest}
            disabled={testing || !webhookUrl.trim()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Bezig met testen...' : 'Test Webhook'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !webhookUrl.trim() || !webhookName.trim() || selectedEvents.length === 0}
              className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Bezig met opslaan...' : 'Webhook Aanmaken'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
