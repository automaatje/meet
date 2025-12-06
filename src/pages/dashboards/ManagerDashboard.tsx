import React from 'react';
import { CheckCircle, AlertCircle, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { SalesLeaderboard } from '../../components/reports/SalesLeaderboard';
import { ForecastChart } from '../../components/reports/ForecastChart';
import { ConversionFunnel } from '../../components/reports/ConversionFunnel';

export function ManagerDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">Team overzicht en performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 lg:p-4 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 lg:w-6 lg:h-6 text-brand-secondary flex-shrink-0" />
            <span className="text-xs text-brand-secondary font-medium flex-shrink-0">+12%</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-bold text-gray-900">€202k</div>
          <div className="text-xs text-gray-600 mt-1">Revenue Deze Maand</div>
        </div>

        <div className="bg-white border rounded-xl p-4 lg:p-4 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-6 lg:h-6 text-brand-primary flex-shrink-0" />
            <span className="text-xs text-brand-primary font-medium flex-shrink-0">€386k</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-bold text-gray-900">52</div>
          <div className="text-xs text-gray-600 mt-1">Active Deals</div>
        </div>

        <div className="bg-white border rounded-xl p-4 lg:p-4 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-2">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-6 lg:h-6 text-emerald-600 flex-shrink-0" />
            <span className="text-xs text-emerald-600 font-medium flex-shrink-0">42%</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-bold text-gray-900">23</div>
          <div className="text-xs text-gray-600 mt-1">Deals Gesloten</div>
        </div>

        <div className="bg-white border rounded-xl p-4 lg:p-4 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 lg:w-6 lg:h-6 text-purple-600 flex-shrink-0" />
            <span className="text-xs text-purple-600 font-medium flex-shrink-0">+8%</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-bold text-gray-900">106</div>
          <div className="text-xs text-gray-600 mt-1">Activities Deze Week</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <h2 className="text-lg font-bold text-gray-900">Deals Needing Approval</h2>
          <span className="ml-auto px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-semibold">
            3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6">
            <div className="font-semibold text-gray-900 mb-1">IsoComfort BV</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">€28.500</div>
            <div className="text-sm text-gray-600 mb-4">Aangevraagd door Jan Bakker</div>
            <div className="flex gap-3">
              <button className="flex-1 bg-brand-secondary text-white py-2.5 px-4 rounded-lg hover:opacity-90 text-sm font-medium">
                Approve
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 text-sm font-medium">
                Reject
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="font-semibold text-gray-900 mb-1">Warmte Wonen</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">€45.000</div>
            <div className="text-sm text-gray-600 mb-4">Aangevraagd door Sophie de Vries</div>
            <div className="flex gap-3">
              <button className="flex-1 bg-brand-secondary text-white py-2.5 px-4 rounded-lg hover:opacity-90 text-sm font-medium">
                Approve
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 text-sm font-medium">
                Reject
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="font-semibold text-gray-900 mb-1">KozijnExpert</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">€32.000</div>
            <div className="text-sm text-gray-600 mb-4">Aangevraagd door Piet Jansen</div>
            <div className="flex gap-3">
              <button className="flex-1 bg-brand-secondary text-white py-2.5 px-4 rounded-lg hover:opacity-90 text-sm font-medium">
                Approve
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 text-sm font-medium">
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <SalesLeaderboard />

      <div className="grid grid-cols-2 gap-6">
        <ForecastChart />
        <ConversionFunnel />
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team Activity Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">78</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Calls</div>
            <div className="text-xs text-brand-secondary mt-1">+12 vs vorige week</div>
          </div>
          <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">34</div>
            <div className="text-xs sm:text-sm text-gray-600">Meetings</div>
            <div className="text-xs text-brand-primary mt-1">+5 vs vorige week</div>
          </div>
          <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">26</div>
            <div className="text-xs sm:text-sm text-gray-600">Quotes Sent</div>
            <div className="text-xs text-gray-500 mt-1">Gelijk aan vorige week</div>
          </div>
          <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">42</div>
            <div className="text-xs sm:text-sm text-gray-600">New Leads</div>
            <div className="text-xs text-brand-secondary mt-1">+8 vs vorige week</div>
          </div>
          <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-1">42%</div>
            <div className="text-xs sm:text-sm text-gray-600">Win Rate</div>
            <div className="text-xs text-brand-secondary mt-1">+3% vs vorige maand</div>
          </div>
        </div>
      </div>
    </div>
  );
}
