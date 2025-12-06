import React from 'react';
import { Filter } from 'lucide-react';

const funnelData = [
  { stage: 'Total Leads', count: 156, percentage: 100, color: 'bg-gray-400' },
  { stage: 'Gekwalificeerd', count: 98, percentage: 63, color: 'bg-blue-400' },
  { stage: 'Offerte', count: 64, percentage: 41, color: 'bg-yellow-400' },
  { stage: 'Onderhandeling', count: 42, percentage: 27, color: 'bg-orange-400' },
  { stage: 'Gewonnen', count: 23, percentage: 15, color: 'bg-green-500' },
];

export function ConversionFunnel() {
  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Conversion Funnel</h2>
      </div>

      <div className="space-y-5">
        {funnelData.map((stage, index) => (
          <div key={stage.stage} className="mb-2">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-900">{stage.count}</span>
              </div>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                <div
                  className={`${stage.color} h-8 rounded-full transition-all duration-500`}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-sm font-semibold ${stage.percentage < 25 ? 'text-gray-700' : 'text-white'}`} style={{ marginLeft: stage.percentage < 25 ? `${stage.percentage}%` : '0' }}>
                  {stage.percentage}%
                </span>
              </div>
            </div>
            {index < funnelData.length - 1 && (
              <div className="text-xs text-red-600 font-medium mt-1 text-right">
                -{((funnelData[index].count - funnelData[index + 1].count) / funnelData[index].count * 100).toFixed(0)}% drop
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">63%</div>
            <div className="text-[11px] text-gray-600 mt-1 leading-tight">Kwalificatie<br />Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">65%</div>
            <div className="text-[11px] text-gray-600 mt-1 leading-tight">Quote to<br />Deal</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-secondary">15%</div>
            <div className="text-[11px] text-gray-600 mt-1 leading-tight">Overall Win<br />Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
