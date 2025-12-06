import React, { useState } from 'react';
import { Zap, Webhook, ExternalLink, Plus } from 'lucide-react';
import { ZapierInstructions } from '../../components/integrations/ZapierInstructions';
import { WebhookManager } from '../../components/integrations/WebhookManager';

export function Integrations() {
  const [showZapierInstructions, setShowZapierInstructions] = useState(false);
  const [showMakeInstructions, setShowMakeInstructions] = useState(false);
  const [showCustomWebhook, setShowCustomWebhook] = useState(false);

  const popularZaps = [
    {
      title: 'Nieuwe klant → Google Spreadsheet',
      description: 'Voeg automatisch nieuwe klanten toe aan je spreadsheet',
    },
    {
      title: 'Project gewonnen → Slack notificatie',
      description: 'Krijg direct een melding in Slack bij gewonnen projecten',
    },
    {
      title: 'Offerte verstuurd → Follow-up taak',
      description: 'Maak automatisch een follow-up taak in je task manager',
    },
    {
      title: 'Factuur betaald → Boekhoudpakket',
      description: 'Synchroniseer betaalde facturen met je boekhouding',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Integraties & Automatisering</h2>
        <p className="text-gray-600 mt-1">Verbind BouwMeet met je favoriete tools en automatiseer je workflow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Zapier Integration</h3>
          <p className="text-gray-700 mb-4">
            Verbind BouwMeet met 6000+ apps via Zapier. Automatiseer je workflow zonder code te schrijven.
          </p>
          <button
            onClick={() => setShowZapierInstructions(true)}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            Setup Zapier
          </button>

          <div className="mt-6 pt-6 border-t border-orange-200">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Populaire Automatiseringen</h4>
            <div className="space-y-2">
              {popularZaps.map((zap, index) => (
                <div key={index} className="bg-white/60 backdrop-blur p-3 rounded-lg">
                  <div className="font-medium text-sm text-gray-900">{zap.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{zap.description}</div>
                </div>
              ))}
            </div>
            <a
              href="https://zapier.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-orange-700 hover:text-orange-800 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Bekijk meer templates op Zapier
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="w-8 h-8 flex items-center justify-center text-2xl">🔷</div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Make.com Integration</h3>
          <p className="text-gray-700 mb-4">
            Bouw geavanceerde automatiseringen met Make.com's visuele workflow builder. Perfect voor complexe scenarios.
          </p>
          <button
            onClick={() => setShowMakeInstructions(true)}
            className="w-full px-4 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition font-medium"
          >
            Setup Make.com
          </button>

          <div className="mt-6 pt-6 border-t border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Waarom Make.com?</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5">✓</span>
                <span>Visuele workflow builder voor complexe automatiseringen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5">✓</span>
                <span>Geavanceerde data transformaties en filters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5">✓</span>
                <span>Error handling en retry mechanismes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5">✓</span>
                <span>Real-time monitoring van je scenarios</span>
              </li>
            </ul>
            <a
              href="https://www.make.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-700 hover:text-blue-800 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Leer meer over Make.com
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Webhook className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Custom Webhooks</h3>
              <p className="text-sm text-gray-600">Voor gevorderde gebruikers en custom integraties</p>
            </div>
          </div>
          <button
            onClick={() => setShowCustomWebhook(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Webhook
          </button>
        </div>

        <WebhookManager />

        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-gray-900 mb-3">Webhook Events</h4>
          <p className="text-sm text-gray-600 mb-4">
            Alle webhooks ontvangen een POST request met het volgende JSON formaat:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "event": "customer.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Jan Jansen",
    "email": "jan@example.com",
    "phone": "+31 6 12345678",
    ...
  }
}`}
          </pre>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-sm text-gray-900 mb-2">Security</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Webhook URLs moeten HTTPS gebruiken</li>
              <li>• Events worden automatisch 3x geretried bij falen</li>
              <li>• Maximum 100 webhook calls per minuut</li>
              <li>• Check de X-Event-Type header om het event type te verifiëren</li>
            </ul>
          </div>
        </div>
      </div>

      {showZapierInstructions && (
        <ZapierInstructions
          platform="zapier"
          onClose={() => setShowZapierInstructions(false)}
        />
      )}

      {showMakeInstructions && (
        <ZapierInstructions
          platform="make"
          onClose={() => setShowMakeInstructions(false)}
        />
      )}

      {showCustomWebhook && (
        <ZapierInstructions
          platform="zapier"
          onClose={() => setShowCustomWebhook(false)}
        />
      )}
    </div>
  );
}
