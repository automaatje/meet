import React from 'react';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface TeamMember {
  name: string;
  activeDeals: number;
  pipelineValue: number;
  dealsClosedThisMonth: number;
  closedValue: number;
  conversionRate: number;
  activitiesThisWeek: number;
}

const mockData: TeamMember[] = [
  { name: 'Jan Bakker', activeDeals: 16, pipelineValue: 125000, dealsClosedThisMonth: 8, closedValue: 67000, conversionRate: 45, activitiesThisWeek: 32 },
  { name: 'Sophie de Vries', activeDeals: 12, pipelineValue: 98000, dealsClosedThisMonth: 6, closedValue: 52000, conversionRate: 42, activitiesThisWeek: 28 },
  { name: 'Piet Jansen', activeDeals: 14, pipelineValue: 87000, dealsClosedThisMonth: 5, closedValue: 45000, conversionRate: 38, activitiesThisWeek: 24 },
  { name: 'Lisa Vermeer', activeDeals: 10, pipelineValue: 76000, dealsClosedThisMonth: 4, closedValue: 38000, conversionRate: 40, activitiesThisWeek: 22 },
];

export function SalesLeaderboard() {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-brand-secondary" />
          <h2 className="text-xl font-bold text-gray-900">Team Leaderboard</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rep</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Active Deals</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pipeline Value</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Closed This Month</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Conversion %</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Activities</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockData.map((member, index) => (
              <tr key={member.name} className={index === 0 ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4">
                  {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                  {index > 0 && <span className="text-gray-500 font-semibold">#{index + 1}</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-700 text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900 font-semibold">{member.activeDeals}</td>
                <td className="px-6 py-4 text-gray-900 font-semibold">€{(member.pipelineValue / 1000).toFixed(0)}k</td>
                <td className="px-6 py-4">
                  <div className="text-gray-900 font-semibold">{member.dealsClosedThisMonth}</div>
                  <div className="text-sm text-brand-secondary">€{(member.closedValue / 1000).toFixed(0)}k</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{member.conversionRate}%</span>
                    {member.conversionRate >= 40 ? (
                      <TrendingUp className="w-4 h-4 text-brand-secondary" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900 font-semibold">{member.activitiesThisWeek}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
