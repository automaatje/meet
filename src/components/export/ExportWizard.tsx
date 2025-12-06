import React, { useState, useEffect } from 'react';
import { X, FileText, FileSpreadsheet, Code, Calendar, Filter, Eye, Download, ChevronRight, ChevronLeft, AlertCircle, Check } from 'lucide-react';
import { FieldMapper } from './FieldMapper';
import { getFieldsForEntity, getPresetsForEntity } from '../../lib/export/field-mappings';
import { exportData, getPreviewData, ExportFormat } from '../../lib/export/csv-generator';
import { supabase } from '../../lib/supabase';

interface ExportWizardProps {
  entity: 'customers' | 'projects' | 'invoices';
  onClose: () => void;
}

type WizardStep = 'format' | 'filters' | 'mapping' | 'preview';

interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
  customerId?: string;
}

export function ExportWizard({ entity, onClose }: ExportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('format');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [data, setData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableFields = getFieldsForEntity(entity);
  const defaultPreset = getPresetsForEntity(entity)[0];

  useEffect(() => {
    if (defaultPreset) {
      setFieldMapping(defaultPreset.mapping);
    }
  }, [entity]);

  useEffect(() => {
    if (entity === 'projects' || entity === 'invoices') {
      loadCustomers();
    }
  }, [entity]);

  useEffect(() => {
    if (currentStep === 'preview') {
      loadData();
    }
  }, [currentStep, filters]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, contact_name, company_name')
        .order('contact_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(entity).select('*');

      if (entity === 'projects') {
        query = supabase
          .from('projects')
          .select(`
            *,
            customer:customers(contact_name, company_name, email, phone)
          `);

        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo);
        }
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.customerId) {
          query = query.eq('customer_id', filters.customerId);
        }
      } else if (entity === 'invoices') {
        query = supabase
          .from('invoices')
          .select(`
            *,
            customer:customers(contact_name, company_name, email, phone),
            project:projects(project_number, title)
          `);

        if (filters.dateFrom) {
          query = query.gte('issue_date', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('issue_date', filters.dateTo);
        }
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.customerId) {
          query = query.eq('customer_id', filters.customerId);
        }
      }

      const { data: result, error } = await query;

      if (error) throw error;
      setData(result || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Fout bij laden van data. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      setError('Geen data om te exporteren');
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${entity}-export-${timestamp}`;

      exportData(data, {
        format,
        filename,
        fieldMapping
      });

      onClose();
    } catch (err) {
      console.error('Export error:', err);
      setError('Fout bij exporteren. Probeer het opnieuw.');
    }
  };

  const canGoNext = () => {
    if (currentStep === 'format') return format !== null;
    if (currentStep === 'mapping') return Object.keys(fieldMapping).length > 0;
    return true;
  };

  const steps = [
    { id: 'format', label: 'Format', icon: FileText },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'mapping', label: 'Velden', icon: FileSpreadsheet },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {entity === 'customers' && 'Klanten Exporteren'}
              {entity === 'projects' && 'Projecten Exporteren'}
              {entity === 'invoices' && 'Facturen Exporteren'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Stap {currentStepIndex + 1} van {steps.length}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center px-6 py-4 border-b bg-gray-50">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 ${currentStepIndex === index ? 'text-brand-primary' : currentStepIndex > index ? 'text-brand-secondary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStepIndex === index ? 'bg-blue-100' : currentStepIndex > index ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {currentStepIndex > index ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {currentStep === 'format' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Selecteer exportformat</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setFormat('csv')}
                  className={`p-6 border-2 rounded-xl text-left transition ${format === 'csv' ? 'border-brand-primary bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <FileText className={`w-8 h-8 mb-3 ${format === 'csv' ? 'text-brand-primary' : 'text-gray-400'}`} />
                  <h4 className="font-semibold text-gray-900 mb-1">CSV</h4>
                  <p className="text-sm text-gray-600">Universeel formaat, werkt overal</p>
                </button>

                <button
                  onClick={() => setFormat('xlsx')}
                  className={`p-6 border-2 rounded-xl text-left transition ${format === 'xlsx' ? 'border-brand-primary bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <FileSpreadsheet className={`w-8 h-8 mb-3 ${format === 'xlsx' ? 'text-brand-primary' : 'text-gray-400'}`} />
                  <h4 className="font-semibold text-gray-900 mb-1">Excel</h4>
                  <p className="text-sm text-gray-600">Voor Microsoft Excel</p>
                </button>

                <button
                  onClick={() => setFormat('json')}
                  className={`p-6 border-2 rounded-xl text-left transition ${format === 'json' ? 'border-brand-primary bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <Code className={`w-8 h-8 mb-3 ${format === 'json' ? 'text-brand-primary' : 'text-gray-400'}`} />
                  <h4 className="font-semibold text-gray-900 mb-1">JSON</h4>
                  <p className="text-sm text-gray-600">Voor ontwikkelaars en API's</p>
                </button>
              </div>
            </div>
          )}

          {currentStep === 'filters' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Filters toepassen (optioneel)</h3>
                <p className="text-sm text-gray-600 mb-4">Beperk de export tot specifieke data</p>
              </div>

              {entity === 'customers' && (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">Geen filters beschikbaar voor klanten. Alle klanten worden geëxporteerd.</p>
                </div>
              )}

              {(entity === 'projects' || entity === 'invoices') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Van datum
                      </label>
                      <input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Tot datum
                      </label>
                      <input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {entity === 'projects' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['lead', 'quote_sent', 'won', 'in_progress', 'completed', 'lost'].map((status) => (
                          <label key={status} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.status?.includes(status) || false}
                              onChange={(e) => {
                                const newStatus = filters.status ? [...filters.status] : [];
                                if (e.target.checked) {
                                  newStatus.push(status);
                                } else {
                                  const index = newStatus.indexOf(status);
                                  if (index > -1) newStatus.splice(index, 1);
                                }
                                setFilters({ ...filters, status: newStatus });
                              }}
                            />
                            <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {entity === 'invoices' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map((status) => (
                          <label key={status} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.status?.includes(status) || false}
                              onChange={(e) => {
                                const newStatus = filters.status ? [...filters.status] : [];
                                if (e.target.checked) {
                                  newStatus.push(status);
                                } else {
                                  const index = newStatus.indexOf(status);
                                  if (index > -1) newStatus.splice(index, 1);
                                }
                                setFilters({ ...filters, status: newStatus });
                              }}
                            />
                            <span className="text-sm capitalize">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Klant</label>
                    <select
                      value={filters.customerId || ''}
                      onChange={(e) => setFilters({ ...filters, customerId: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Alle klanten</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.company_name || customer.contact_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'mapping' && (
            <FieldMapper
              entity={entity}
              availableFields={availableFields}
              selectedMapping={fieldMapping}
              onMappingChange={setFieldMapping}
            />
          )}

          {currentStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Preview</h3>
                {!loading && (
                  <div className="text-sm text-gray-600">
                    <strong>{data.length}</strong> {data.length === 1 ? 'record' : 'records'} klaar voor export
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Geen data gevonden met de huidige filters</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {Object.values(fieldMapping).map((fieldName) => (
                            <th key={fieldName} className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                              {fieldName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getPreviewData(data, fieldMapping, 5).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-3 text-gray-900 whitespace-nowrap">
                                {String(value || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {data.length > 5 && (
                    <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600 text-center">
                      En nog {data.length - 5} records...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 p-6 border-t bg-gray-50">
          <button
            onClick={() => {
              const stepIndex = steps.findIndex(s => s.id === currentStep);
              if (stepIndex > 0) {
                setCurrentStep(steps[stepIndex - 1].id as WizardStep);
              }
            }}
            disabled={currentStepIndex === 0}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Vorige
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Annuleren
            </button>

            {currentStep === 'preview' ? (
              <button
                onClick={handleExport}
                disabled={loading || data.length === 0}
                className="px-6 py-2 bg-brand-secondary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Export
              </button>
            ) : (
              <button
                onClick={() => {
                  const stepIndex = steps.findIndex(s => s.id === currentStep);
                  if (stepIndex < steps.length - 1) {
                    setCurrentStep(steps[stepIndex + 1].id as WizardStep);
                  }
                }}
                disabled={!canGoNext()}
                className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Volgende
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
