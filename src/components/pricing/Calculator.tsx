import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Loader } from 'lucide-react';
import { pricingService, measurementService } from '../../lib/supabase';
import IsdeSubsidyCalculator from './IsdeSubsidyCalculator';

interface Template {
  id: string;
  name: string;
  material_price_m2: number;
  labor_price_m2: number;
  waste_percentage: number;
  vat_percentage: number;
  is_default: boolean;
}

interface LineItem {
  id: string;
  description: string;
  area_m2: number;
  template_id: string | null;
  material_price_m2: number;
  labor_price_m2: number;
  waste_percentage: number;
  vat_percentage: number;
  sort_order: number;
  isde_subsidy_type: string | null;
  isde_subsidy_amount: number;
  is_double_measure: boolean;
}

interface CalculatorProps {
  projectId: string;
  onTotalChange?: (total: number) => void;
}

export default function Calculator({ projectId, onTotalChange }: CalculatorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingMeasurements, setAddingMeasurements] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [templatesData, lineItemsData] = await Promise.all([
        pricingService.getTemplates(),
        pricingService.getLineItems(projectId),
      ]);
      setTemplates(templatesData || []);
      setLineItems(lineItemsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLineFromMeasurement = async () => {
    setAddingMeasurements(true);
    try {
      const measurements = await measurementService.getByProject(projectId);

      if (!measurements || measurements.length === 0) {
        alert('Geen metingen gevonden. Voeg eerst metingen toe bij het Metingen tabblad.');
        return;
      }

      const defaultTemplate = templates.find(t => t.is_default) || templates[0];

      if (!defaultTemplate) {
        alert('Maak eerst een prijssjabloon aan in Instellingen');
        return;
      }

      let addedCount = 0;
      for (const measurement of measurements) {
        const exists = lineItems.some(li =>
          li.description.includes(`Meting ${measurement.net_area_m2.toFixed(2)} m²`)
        );
        if (!exists) {
          await pricingService.createLineItem({
            project_id: projectId,
            description: `Meting ${measurement.net_area_m2.toFixed(2)} m²`,
            area_m2: measurement.net_area_m2,
            template_id: defaultTemplate.id,
            material_price_m2: defaultTemplate.material_price_m2,
            labor_price_m2: defaultTemplate.labor_price_m2,
            waste_percentage: defaultTemplate.waste_percentage,
            vat_percentage: defaultTemplate.vat_percentage,
            sort_order: lineItems.length + addedCount,
          });
          addedCount++;
        }
      }

      if (addedCount === 0) {
        alert('Alle metingen zijn al toegevoegd aan de offerte.');
      } else {
        alert(`${addedCount} ${addedCount === 1 ? 'meting' : 'metingen'} toegevoegd!`);
      }

      loadData();
    } catch (error) {
      console.error('Error adding from measurements:', error);
      alert('Er is een fout opgetreden bij het toevoegen van metingen.');
    } finally {
      setAddingMeasurements(false);
    }
  };

  const addNewLine = async () => {
    const defaultTemplate = templates.find(t => t.is_default) || templates[0];
    if (!defaultTemplate) {
      alert('Maak eerst een prijssjabloon aan in Instellingen');
      return;
    }

    try {
      await pricingService.createLineItem({
        project_id: projectId,
        description: 'Nieuwe regel',
        area_m2: 0,
        template_id: defaultTemplate.id,
        material_price_m2: defaultTemplate.material_price_m2,
        labor_price_m2: defaultTemplate.labor_price_m2,
        waste_percentage: defaultTemplate.waste_percentage,
        vat_percentage: defaultTemplate.vat_percentage,
        sort_order: lineItems.length,
      });
      loadData();
    } catch (error) {
      console.error('Error adding line:', error);
    }
  };

  const updateLineLocal = useCallback((id: string, updates: Partial<LineItem>) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const updateLine = useCallback(async (id: string, updates: Partial<LineItem>) => {
    setSaving(true);
    try {
      await pricingService.updateLineItem(id, updates);
    } catch (error) {
      console.error('Error updating line:', error);
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteLine = async (id: string) => {
    try {
      await pricingService.deleteLineItem(id);
      loadData();
    } catch (error) {
      console.error('Error deleting line:', error);
    }
  };

  const applyTemplate = (lineId: string, templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const updates = {
        template_id: templateId,
        material_price_m2: template.material_price_m2,
        labor_price_m2: template.labor_price_m2,
        waste_percentage: template.waste_percentage,
        vat_percentage: template.vat_percentage,
      };
      updateLineLocal(lineId, updates);
      updateLine(lineId, updates);
    }
  };

  const getSubsidyConfig = (type: string | null) => {
    const configs: Record<string, { singleRate: number; doubleRate: number; maxArea: number }> = {
      spouwmuurisolatie: { singleRate: 5.25, doubleRate: 10.50, maxArea: 170 },
      vloerisolatie: { singleRate: 5.50, doubleRate: 11.00, maxArea: 130 },
      dakisolatie: { singleRate: 16.25, doubleRate: 32.50, maxArea: 200 },
      kunststof_kozijnen_triple_glas: { singleRate: 111, doubleRate: 222, maxArea: 45 },
    };
    return type ? configs[type] : null;
  };

  const totalMeasuresWithSubsidy = lineItems.filter(item => item.isde_subsidy_type).length;
  const isDoubleMeasure = totalMeasuresWithSubsidy >= 2;

  const calculateTotals = useCallback(() => {
    let materialTotal = 0;
    let laborTotal = 0;
    let subtotal = 0;
    let vatTotal = 0;
    let subsidyTotal = 0;

    const measuresCount = lineItems.filter(item => item.isde_subsidy_type).length;
    const isDouble = measuresCount >= 2;

    lineItems.forEach(item => {
      const material = item.area_m2 * item.material_price_m2 * (1 + item.waste_percentage / 100);
      const labor = item.area_m2 * item.labor_price_m2;
      const lineSubtotal = material + labor;
      const vat = lineSubtotal * (item.vat_percentage / 100);

      let subsidy = 0;
      if (item.isde_subsidy_type) {
        const config = getSubsidyConfig(item.isde_subsidy_type);
        if (config) {
          const cappedArea = Math.min(item.area_m2, config.maxArea);
          const rate = isDouble ? config.doubleRate : config.singleRate;
          subsidy = cappedArea * rate;
        }
      }

      materialTotal += material;
      laborTotal += labor;
      subtotal += lineSubtotal;
      vatTotal += vat;
      subsidyTotal += subsidy;
    });

    const total = subtotal + vatTotal;
    const totalAfterSubsidy = total - subsidyTotal;

    return {
      material: materialTotal,
      labor: laborTotal,
      subtotal,
      vat: vatTotal,
      subsidy: subsidyTotal,
      total,
      totalAfterSubsidy,
    };
  }, [lineItems]);

  useEffect(() => {
    const totals = calculateTotals();
    if (onTotalChange) {
      onTotalChange(totals.total);
    }
  }, [lineItems, onTotalChange, calculateTotals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      {saving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-blue-700">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Opslaan...</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={addLineFromMeasurement}
          disabled={addingMeasurements}
          className="bg-brand-secondary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {addingMeasurements && <Loader className="w-4 h-4 animate-spin" />}
          {addingMeasurements ? 'Bezig met toevoegen...' : 'Metingen toevoegen'}
        </button>
        <button
          onClick={addNewLine}
          className="bg-brand-primary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Regel toevoegen
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Beschrijving</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">m²</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Sjabloon</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Subtotaal</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => {
                const material = item.area_m2 * item.material_price_m2 * (1 + item.waste_percentage / 100);
                const labor = item.area_m2 * item.labor_price_m2;
                const lineSubtotal = material + labor;
                const vat = lineSubtotal * (item.vat_percentage / 100);
                const lineTotal = lineSubtotal + vat;

                return (
                  <>
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineLocal(item.id, { description: e.target.value })}
                          onBlur={(e) => updateLine(item.id, { description: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={item.area_m2}
                          onChange={(e) => updateLineLocal(item.id, { area_m2: parseFloat(e.target.value) || 0 })}
                          onBlur={(e) => updateLine(item.id, { area_m2: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={item.template_id || ''}
                          onChange={(e) => applyTemplate(item.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded"
                        >
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right font-semibold">€{lineTotal.toFixed(2)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteLine(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    <tr key={`${item.id}-subsidy`} className="border-b bg-gray-50">
                      <td colSpan={5} className="p-3">
                        <IsdeSubsidyCalculator
                          subsidyType={item.isde_subsidy_type}
                          areaM2={item.area_m2}
                          totalMeasuresInProject={totalMeasuresWithSubsidy}
                          onSubsidyTypeChange={(type) => {
                            const updates = { isde_subsidy_type: type };
                            updateLineLocal(item.id, updates);
                            updateLine(item.id, updates);
                          }}
                        />
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Materiaalkosten (incl. waste):</span>
            <span className="font-semibold">€{totals.material.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Arbeidskosten:</span>
            <span className="font-semibold">€{totals.labor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-600">Subtotaal excl. BTW:</span>
            <span className="font-semibold">€{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">BTW:</span>
            <span className="font-semibold">€{totals.vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t-2">
            <span className="text-lg font-bold text-gray-900">TOTAAL incl. BTW:</span>
            <span className="text-2xl font-bold text-gray-900">€{totals.total.toFixed(2)}</span>
          </div>
          {totals.subsidy > 0 && (
            <>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">ISDE Subsidie (RVO):</span>
                <span className="font-semibold text-brand-secondary">- €{totals.subsidy.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t-2">
                <span className="text-lg font-bold text-gray-900">TE BETALEN na subsidie:</span>
                <span className="text-2xl font-bold text-brand-secondary">€{totals.totalAfterSubsidy.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
