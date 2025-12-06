import React from 'react';
import { Target, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface TargetProgressProps {
  targetRevenue: number;
  achievedRevenue: number;
  periodStart: string;
  periodEnd: string;
  targetDeals?: number;
  achievedDeals?: number;
}

export function TargetProgress({
  targetRevenue,
  achievedRevenue,
  periodStart,
  periodEnd,
  targetDeals,
  achievedDeals,
}: TargetProgressProps) {
  const progressPercentage = (achievedRevenue / targetRevenue) * 100;
  const remaining = targetRevenue - achievedRevenue;

  // Calculate days
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const today = new Date();
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const expectedProgress = (daysElapsed / totalDays) * 100;

  // Status determination
  const isOnTrack = progressPercentage >= expectedProgress - 10;
  const isCritical = progressPercentage < expectedProgress - 25;

  const statusColor = isCritical
    ? 'text-red-600'
    : !isOnTrack
    ? 'text-orange-600'
    : 'text-brand-secondary';
  const barColor = isCritical ? 'bg-red-600' : !isOnTrack ? 'bg-orange-500' : 'bg-brand-secondary';

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target className={`w-6 h-6 ${statusColor}`} />
          <h3 className="text-lg font-bold text-gray-900">Revenue Target</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {daysRemaining} dagen resterend
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-600 mb-1">Target</div>
          <div className="text-2xl font-bold text-gray-900">
            €{(targetRevenue / 1000).toFixed(0)}k
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Behaald</div>
          <div className={`text-2xl font-bold ${statusColor}`}>
            €{(achievedRevenue / 1000).toFixed(0)}k
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Resterend</div>
          <div className="text-2xl font-bold text-gray-900">
            €{(remaining / 1000).toFixed(0)}k
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className={`font-semibold ${statusColor}`}>
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
          {/* Milestone markers */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className="w-px bg-white h-full"
                style={{ marginLeft: `${milestone}%` }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div
            className={`${barColor} h-full transition-all duration-500 flex items-center justify-end pr-2`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          >
            {progressPercentage >= 15 && (
              <span className="text-xs font-semibold text-white">
                {progressPercentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          {isCritical ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">
                Critically Behind - Needs Immediate Action
              </span>
            </>
          ) : !isOnTrack ? (
            <>
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-orange-600 font-medium">Behind Schedule</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-brand-secondary" />
              <span className="text-brand-secondary font-medium">On Track</span>
            </>
          )}
        </div>
      </div>

      {targetDeals && achievedDeals !== undefined && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Deals Closed</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {achievedDeals} / {targetDeals}
              </span>
              {achievedDeals >= targetDeals ? (
                <TrendingUp className="w-4 h-4 text-brand-secondary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
