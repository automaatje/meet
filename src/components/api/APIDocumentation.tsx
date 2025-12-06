import React, { useState } from 'react';
import { BookOpen, Code, Copy, Check, Play, ExternalLink } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: string;
  scopes: string[];
  params?: { name: string; type: string; required: boolean; description: string }[];
  queryParams?: { name: string; type: string; required: boolean; description: string }[];
  body?: any;
  response: any;
  errors?: { code: string; status: number; description: string }[];
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/products',
    description: 'Haal productcatalogus op',
    auth: 'Bearer {api_key}',
    scopes: ['products:read'],
    queryParams: [
      { name: 'category', type: 'string', required: false, description: 'Filter op categorie' },
      { name: 'limit', type: 'integer', required: false, description: 'Aantal resultaten (default: 100)' },
      { name: 'offset', type: 'integer', required: false, description: 'Paginatie offset (default: 0)' },
    ],
    response: {
      data: [
        {
          id: 'uuid',
          name: 'Kunststof Kozijn Wit',
          category: 'window',
          price: 599.0,
          stock: 45,
          specifications: {},
        },
      ],
      meta: {
        total: 234,
        limit: 100,
        offset: 0,
      },
    },
    errors: [
      { code: 'UNAUTHORIZED', status: 401, description: 'Ongeldige of missende API key' },
      { code: 'FORBIDDEN', status: 403, description: 'Onvoldoende rechten (products:read vereist)' },
      { code: 'RATE_LIMIT_EXCEEDED', status: 429, description: 'Rate limit overschreden' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/products',
    description: 'Voeg nieuw product toe',
    auth: 'Bearer {api_key}',
    scopes: ['products:write'],
    body: {
      name: 'Kunststof Kozijn Wit',
      category: 'window',
      price: 599.0,
      stock: 45,
      specifications: {},
    },
    response: {
      data: {
        id: 'uuid',
        name: 'Kunststof Kozijn Wit',
        category: 'window',
        price: 599.0,
        stock: 45,
        created_at: '2025-12-01T12:00:00Z',
      },
    },
    errors: [
      { code: 'UNAUTHORIZED', status: 401, description: 'Ongeldige of missende API key' },
      { code: 'FORBIDDEN', status: 403, description: 'Onvoldoende rechten (products:write vereist)' },
      { code: 'VALIDATION_ERROR', status: 400, description: 'Ongeldige of missende velden' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/partner/products/sync',
    description: 'Sync partner productcatalogus (groothandels)',
    auth: 'Bearer {api_key}',
    scopes: ['products:write'],
    body: [
      {
        external_id: 'PART-12345',
        category: 'window',
        name: 'Kunststof Kozijn Wit',
        brand: 'VekaPlus',
        sku: 'VKP-W-100',
        price: 599.0,
        stock_quantity: 45,
        specifications: { width: 100, height: 150, color: 'white' },
        image_urls: ['https://example.com/image1.jpg'],
      },
    ],
    response: {
      synced: 1,
      failed: 0,
      results: [
        {
          external_id: 'PART-12345',
          success: true,
          id: 'uuid',
        },
      ],
    },
  },
  {
    method: 'GET',
    path: '/api/v1/partner/products',
    description: 'Haal eigen partner producten op',
    auth: 'Bearer {api_key}',
    scopes: ['products:read'],
    response: {
      data: [
        {
          id: 'uuid',
          external_id: 'PART-12345',
          category: 'window',
          name: 'Kunststof Kozijn Wit',
          brand: 'VekaPlus',
          sku: 'VKP-W-100',
          price: 599.0,
          stock_quantity: 45,
          last_synced_at: '2025-12-01T12:00:00Z',
        },
      ],
    },
  },
];

export function APIDocumentation() {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [playgroundKey, setPlaygroundKey] = useState('');
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('');
  const [playgroundResponse, setPlaygroundResponse] = useState('');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-amber-100 text-amber-700',
      DELETE: 'bg-red-100 text-red-700',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const generateCurlCommand = (endpoint: Endpoint) => {
    let curl = `curl -X ${endpoint.method} \\
  "${window.location.origin}${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;

    if (endpoint.body) {
      curl += ` \\
  -d '${JSON.stringify(endpoint.body, null, 2)}'`;
    }

    return curl;
  };

  const generateJavaScriptCode = (endpoint: Endpoint) => {
    return `const apiUrl = '${window.location.origin}${endpoint.path}';

const response = await fetch(apiUrl, {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },${
    endpoint.body
      ? `\n  body: JSON.stringify(${JSON.stringify(endpoint.body, null, 4)}),`
      : ''
  }
});

const data = await response.json();
console.log(data);`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-primary to-indigo-600 text-white rounded-xl p-8">
        <div className="flex items-start gap-4">
          <BookOpen className="w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold mb-2">BouwMeet API Documentatie</h2>
            <p className="text-blue-100 mb-4">
              Integreer met BouwMeet via onze RESTful API. Perfect voor leveranciers, groothandels en
              systeem integraties.
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold">Base URL:</span> {window.location.origin}
              </div>
              <div>
                <span className="font-semibold">Version:</span> v1
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Authenticatie</h3>
        <p className="text-gray-600 mb-4">
          Alle API requests vereisen authenticatie via een API key in de Authorization header:
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
          Authorization: Bearer bm_live_your_api_key_here
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Endpoints</h3>

        {ENDPOINTS.map((endpoint, index) => {
          const endpointId = `${endpoint.method}-${endpoint.path}`;
          const isExpanded = expandedEndpoint === endpointId;

          return (
            <div key={index} className="bg-white rounded-xl border overflow-hidden">
              <button
                onClick={() => setExpandedEndpoint(isExpanded ? null : endpointId)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`px-3 py-1 rounded font-semibold text-sm ${getMethodColor(
                    endpoint.method
                  )}`}
                >
                  {endpoint.method}
                </span>
                <code className="flex-1 text-left font-mono text-sm text-gray-900">
                  {endpoint.path}
                </code>
                <span className="text-gray-600 text-sm">{endpoint.description}</span>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t">
                  <div className="pt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Beschrijving</h4>
                    <p className="text-gray-600">{endpoint.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Vereiste Scopes</h4>
                    <div className="flex gap-2">
                      {endpoint.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  {endpoint.queryParams && endpoint.queryParams.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Query Parameters</h4>
                      <div className="space-y-2">
                        {endpoint.queryParams.map((param) => (
                          <div key={param.name} className="flex gap-4 text-sm">
                            <code className="font-mono text-brand-primary">{param.name}</code>
                            <span className="text-gray-500">{param.type}</span>
                            <span className="text-gray-400">
                              {param.required ? 'required' : 'optional'}
                            </span>
                            <span className="text-gray-600">{param.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {endpoint.body && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          {JSON.stringify(endpoint.body, null, 2)}
                        </pre>
                        <button
                          onClick={() =>
                            copyToClipboard(JSON.stringify(endpoint.body, null, 2), `body-${index}`)
                          }
                          className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded"
                        >
                          {copied === `body-${index}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(endpoint.response, null, 2)}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(endpoint.response, null, 2),
                            `response-${index}`
                          )
                        }
                        className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded"
                      >
                        {copied === `response-${index}` ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {endpoint.errors && endpoint.errors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Error Codes</h4>
                      <div className="space-y-2">
                        {endpoint.errors.map((error) => (
                          <div
                            key={error.code}
                            className="flex items-center gap-4 text-sm bg-red-50 px-4 py-2 rounded"
                          >
                            <span className="font-mono text-red-700">{error.status}</span>
                            <span className="font-semibold text-red-900">{error.code}</span>
                            <span className="text-red-700">{error.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Code Examples</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">cURL</span>
                          <button
                            onClick={() =>
                              copyToClipboard(generateCurlCommand(endpoint), `curl-${index}`)
                            }
                            className="text-sm text-brand-primary hover:text-blue-700 flex items-center gap-1"
                          >
                            {copied === `curl-${index}` ? (
                              <>
                                <Check className="w-4 h-4" />
                                Gekopieerd
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Kopieer
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          {generateCurlCommand(endpoint)}
                        </pre>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">JavaScript</span>
                          <button
                            onClick={() =>
                              copyToClipboard(generateJavaScriptCode(endpoint), `js-${index}`)
                            }
                            className="text-sm text-brand-primary hover:text-blue-700 flex items-center gap-1"
                          >
                            {copied === `js-${index}` ? (
                              <>
                                <Check className="w-4 h-4" />
                                Gekopieerd
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Kopieer
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          {generateJavaScriptCode(endpoint)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Best Practices</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <span>Bewaar API keys veilig en deel ze nooit publiekelijk</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <span>Implementeer exponential backoff bij rate limit errors</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <span>Cache responses waar mogelijk om API calls te minimaliseren</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <span>Gebruik webhooks voor realtime notificaties in plaats van polling</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <span>Monitor je API usage via het analytics dashboard</span>
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Support</h3>
        <p className="text-gray-600 mb-4">
          Hulp nodig met de API? Neem contact op met ons developer support team:
        </p>
        <div className="flex gap-4">
          <a
            href="mailto:api@bouwmeet.nl"
            className="flex items-center gap-2 text-brand-primary hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            api@bouwmeet.nl
          </a>
        </div>
      </div>
    </div>
  );
}
