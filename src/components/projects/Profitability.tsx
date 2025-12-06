import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Download,
  AlertCircle,
} from 'lucide-react';
import { ListSkeleton } from '../LoadingSkeleton';

interface ProfitabilityProps {
  projectId: string;
}

interface WorkOrderData {
  id: string;
  work_order_number: string;
  title: string;
  estimated_hours: number | null;
  actual_hours: number;
  time_entries: Array<{
    total_hours: number;
    employee: {
      name: string;
      hourly_rate: number;
    };
  }>;
}

interface QuoteData {
  total_amount: number;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export default function Profitability({ projectId }: ProfitabilityProps) {
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [materialCosts, setMaterialCosts] = useState(0);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);

    const [workOrdersRes, quoteRes] = await Promise.all([
      supabase
        .from('work_orders')
        .select(
          `
          id,
          work_order_number,
          title,
          estimated_hours,
          actual_hours,
          time_entries (
            total_hours,
            employee:employees (
              name,
              hourly_rate
            )
          )
        `
        )
        .eq('project_id', projectId),

      supabase
        .from('quotes')
        .select(
          `
          total_amount,
          line_items:quote_line_items (
            description,
            quantity,
            unit_price,
            total
          )
        `
        )
        .eq('project_id', projectId)
        .maybeSingle(),
    ]);

    if (workOrdersRes.data) {
      setWorkOrders(workOrdersRes.data as any);
    }

    if (quoteRes.data) {
      setQuote(quoteRes.data as any);
      const materials = (quoteRes.data as any).line_items
        ?.filter((item: any) => item.description?.toLowerCase().includes('materiaal'))
        .reduce((sum: number, item: any) => sum + item.total, 0) || 0;
      setMaterialCosts(materials);
    }

    setLoading(false);
  };

  const calculateEstimatedHours = () => {
    return workOrders.reduce((sum, wo) => sum + (wo.estimated_hours || 0), 0);
  };

  const calculateActualHours = () => {
    return workOrders.reduce((sum, wo) => sum + wo.actual_hours, 0);
  };

  const calculateActualLaborCost = () => {
    let total = 0;
    workOrders.forEach((wo) => {
      wo.time_entries?.forEach((entry: any) => {
        total += entry.total_hours * (entry.employee?.hourly_rate || 0);
      });
    });
    return total;
  };

  const calculateEstimatedLaborCost = () => {
    const avgHourlyRate = 45;
    return calculateEstimatedHours() * avgHourlyRate;
  };

  const exportToCSV = () => {
    const estimatedHours = calculateEstimatedHours();
    const actualHours = calculateActualHours();
    const estimatedCost = calculateEstimatedLaborCost();
    const actualCost = calculateActualLaborCost();
    const revenue = quote?.total_amount || 0;
    const profit = revenue - actualCost - materialCosts;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const csvContent = [
      ['Nacalculatie Rapport'],
      [''],
      ['Geoffreerd'],
      ['Uren', estimatedHours],
      ['Arbeidskosten', `€${estimatedCost.toFixed(2)}`],
      ['Offerte totaal', `€${revenue.toFixed(2)}`],
      [''],
      ['Werkelijk'],
      ['Uren', actualHours],
      ['Arbeidskosten', `€${actualCost.toFixed(2)}`],
      ['Materiaalkosten', `€${materialCosts.toFixed(2)}`],
      ['Totale kosten', `€${(actualCost + materialCosts).toFixed(2)}`],
      [''],
      ['Analyse'],
      ['Urenverschil', `${(actualHours - estimatedHours).toFixed(1)} uur`],
      ['Kostenverschil', `€${(actualCost - estimatedCost).toFixed(2)}`],
      ['Winst', `€${profit.toFixed(2)}`],
      ['Winstmarge', `${profitMargin.toFixed(1)}%`],
      [''],
      ['Werkbonnen'],
      ['Nummer', 'Titel', 'Geoffreerd', 'Werkelijk', 'Verschil'],
      ...workOrders.map((wo) => [
        wo.work_order_number,
        wo.title,
        `${wo.estimated_hours || 0}u`,
        `${wo.actual_hours}u`,
        `${(wo.actual_hours - (wo.estimated_hours || 0)).toFixed(1)}u`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nacalculatie_${projectId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-4">
        <ListSkeleton count={4} />
      </div>
    );
  }

  if (workOrders.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen data beschikbaar</h3>
          <p className="text-gray-600">
            Maak werkbonnen aan en registreer uren om winstanalyse te zien
          </p>
        </div>
      </div>
    );
  }

  const estimatedHours = calculateEstimatedHours();
  const actualHours = calculateActualHours();
  const estimatedCost = calculateEstimatedLaborCost();
  const actualCost = calculateActualLaborCost();
  const hoursDiff = actualHours - estimatedHours;
  const hoursPercentage = estimatedHours > 0 ? (hoursDiff / estimatedHours) * 100 : 0;
  const costDiff = actualCost - estimatedCost;
  const costPercentage = estimatedCost > 0 ? (costDiff / estimatedCost) * 100 : 0;

  const revenue = quote?.total_amount || 0;
  const totalCosts = actualCost + materialCosts;
  const profit = revenue - totalCosts;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const hasActualHours = actualHours > 0;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Winstanalyse</h2>
          <p className="text-sm text-gray-600 mt-1">Geoffreerd vs. werkelijk</p>
        </div>
        {hasActualHours && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Exporteer
          </button>
        )}
      </div>

      {!hasActualHours && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Nog geen werkelijke uren</p>
              <p className="text-sm text-amber-700 mt-1">
                Registreer uren in de werkbonnen om een volledige winstanalyse te zien
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-brand-primary rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-sm">Geoffreerd</span>
            <Clock className="w-5 h-5 text-blue-200" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold">{estimatedHours.toFixed(1)}u</div>
              <div className="text-blue-100 text-sm">Geschatte uren</div>
            </div>
            <div className="border-t border-blue-400 pt-3">
              <div className="text-xl font-semibold">€{estimatedCost.toFixed(0)}</div>
              <div className="text-blue-100 text-sm">Arbeidskosten</div>
            </div>
            {quote && (
              <div className="border-t border-blue-400 pt-3">
                <div className="text-xl font-semibold">€{revenue.toFixed(0)}</div>
                <div className="text-blue-100 text-sm">Offerte totaal</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-100 text-sm">Werkelijk</span>
            <Users className="w-5 h-5 text-green-200" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold">{actualHours.toFixed(1)}u</div>
              <div className="text-green-100 text-sm">Gewerkte uren</div>
            </div>
            <div className="border-t border-green-400 pt-3">
              <div className="text-xl font-semibold">€{actualCost.toFixed(0)}</div>
              <div className="text-green-100 text-sm">Arbeidskosten</div>
            </div>
            <div className="border-t border-green-400 pt-3">
              <div className="text-xl font-semibold">€{totalCosts.toFixed(0)}</div>
              <div className="text-green-100 text-sm">Totale kosten</div>
            </div>
          </div>
        </div>
      </div>

      {hasActualHours && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              Vergelijking
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Urenverschil</span>
                  <div className="flex items-center gap-2">
                    {hoursDiff > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span
                      className={`font-semibold ${
                        hoursDiff > 0 ? 'text-red-600' : 'text-brand-secondary'
                      }`}
                    >
                      {hoursDiff > 0 ? '+' : ''}
                      {hoursDiff.toFixed(1)}u ({hoursPercentage > 0 ? '+' : ''}
                      {hoursPercentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${
                      hoursDiff > 0 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(hoursPercentage))}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Kostenverschil</span>
                  <div className="flex items-center gap-2">
                    {costDiff > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span
                      className={`font-semibold ${
                        costDiff > 0 ? 'text-red-600' : 'text-brand-secondary'
                      }`}
                    >
                      {costDiff > 0 ? '+' : ''}€{Math.abs(costDiff).toFixed(0)} (
                      {costPercentage > 0 ? '+' : ''}
                      {costPercentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${
                      costDiff > 0 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(costPercentage))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {quote && (
            <div
              className={`rounded-xl border-2 p-5 ${
                profit >= 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    profit >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <DollarSign
                    className={`w-6 h-6 ${
                      profit >= 0 ? 'text-brand-secondary' : 'text-red-600'
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-semibold ${
                      profit >= 0 ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    Winstberekening
                  </h3>
                  <p className={`text-sm ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Offerte €{revenue.toFixed(0)} - Kosten €{totalCosts.toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div
                    className={`text-3xl font-bold ${
                      profit >= 0 ? 'text-brand-secondary' : 'text-red-600'
                    }`}
                  >
                    €{Math.abs(profit).toFixed(0)}
                  </div>
                  <div className={`text-sm ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {profit >= 0 ? 'Winst' : 'Verlies'}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-3xl font-bold ${
                      profitMargin >= 0 ? 'text-brand-secondary' : 'text-red-600'
                    }`}
                  >
                    {profitMargin.toFixed(1)}%
                  </div>
                  <div className={`text-sm ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Marge
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Werkbonnen Analyse</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {workOrders.map((wo) => {
            const woDiff = wo.actual_hours - (wo.estimated_hours || 0);
            const woPercentage =
              wo.estimated_hours && wo.estimated_hours > 0
                ? (woDiff / wo.estimated_hours) * 100
                : 0;

            return (
              <div key={wo.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-mono text-xs text-gray-600 mb-1">
                      {wo.work_order_number}
                    </div>
                    <div className="font-medium text-gray-900">{wo.title}</div>
                  </div>
                  {wo.actual_hours > 0 && (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        woDiff > 0
                          ? 'bg-red-100 text-red-700'
                          : woDiff < 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {woDiff > 0 ? '+' : ''}
                      {woDiff.toFixed(1)}u
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Geoffreerd: </span>
                    <span className="font-medium text-gray-900">
                      {wo.estimated_hours || 0}u
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Werkelijk: </span>
                    <span className="font-medium text-gray-900">{wo.actual_hours.toFixed(1)}u</span>
                  </div>
                </div>

                {wo.actual_hours > 0 && wo.estimated_hours && wo.estimated_hours > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          woDiff > 0 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.abs(woPercentage))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
