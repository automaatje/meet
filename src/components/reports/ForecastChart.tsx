import React from 'react';
import { TrendingUp } from 'lucide-react';

const mockForecast = [
  { month: 'Dec', realistic: 125000, bestCase: 180000 },
  { month: 'Jan', realistic: 145000, bestCase: 210000 },
  { month: 'Feb', realistic: 132000, bestCase: 195000 },
  { month: 'Mrt', realistic: 168000, bestCase: 245000 },
  { month: 'Apr', realistic: 155000, bestCase: 225000 },
  { month: 'Mei', realistic: 175000, bestCase: 255000 },
];

export function ForecastChart() {
  const maxValue = Math.max(...mockForecast.map(m => m.bestCase));

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-brand-primary" />
        <h2 className="text-xl font-bold text-gray-900">Pipeline Forecast</h2>
      </div>

      <div className="w-full overflow-hidden">
        <div className="flex items-end justify-between h-80 gap-2 pb-12 px-2">
          {mockForecast.map((month, index) => (
            <div key={month.month} className="flex-1 flex flex-col items-center h-full min-w-0">
              <div className="w-full flex flex-col items-center gap-2 flex-1 justify-end">
                <div
                  className="w-full bg-blue-200 rounded-t-lg relative group cursor-pointer hover:bg-blue-300 transition-colors"
                  style={{ height: `${(month.bestCase / maxValue) * 100}%` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold text-blue-900">
                      €{(month.bestCase / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
                <div
                  className="w-full bg-brand-primary rounded-t-lg relative group cursor-pointer hover:opacity-90 transition-colors"
                  style={{ height: `${(month.realistic / maxValue) * 100}%` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold text-white">
                      €{(month.realistic / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm font-medium text-gray-700 whitespace-nowrap">{month.month}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-brand-primary rounded"></div>
          <span className="text-sm text-gray-700">Realistic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <span className="text-sm text-gray-700">Best Case</span>
        </div>
      </div>
    </div>
  );
}
