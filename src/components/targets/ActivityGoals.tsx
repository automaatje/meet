import React from 'react';
import { Phone, Calendar, FileText, Video, Mail, CheckCircle } from 'lucide-react';

interface ActivityGoal {
  type: 'calls' | 'meetings' | 'quotes' | 'demos' | 'emails';
  target: number;
  achieved: number;
  period: string;
}

interface ActivityGoalsProps {
  goals: ActivityGoal[];
}

const ACTIVITY_CONFIG = {
  calls: { icon: Phone, label: 'Calls', color: 'blue' },
  meetings: { icon: Calendar, label: 'Meetings', color: 'green' },
  quotes: { icon: FileText, label: 'Quotes', color: 'purple' },
  demos: { icon: Video, label: 'Demos', color: 'orange' },
  emails: { icon: Mail, label: 'Emails', color: 'indigo' },
};

export function ActivityGoals({ goals }: ActivityGoalsProps) {
  return (
    <div className="bg-white border rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Mijn Doelen</h3>

      <div className="space-y-4">
        {goals.map((goal) => {
          const config = ACTIVITY_CONFIG[goal.type];
          const Icon = config.icon;
          const progressPercentage = (goal.achieved / goal.target) * 100;
          const isComplete = goal.achieved >= goal.target;
          const isOnTrack = progressPercentage >= 75;

          return (
            <div key={goal.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${config.color}-600`} />
                  <span className="text-sm font-medium text-gray-700">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {goal.achieved} / {goal.target}
                  </span>
                  {isComplete && <CheckCircle className="w-4 h-4 text-brand-secondary" />}
                </div>
              </div>

              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${config.color}-600 h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{goal.period}</span>
                {isComplete ? (
                  <span className="text-brand-secondary font-medium">Completed!</span>
                ) : isOnTrack ? (
                  <span className="text-brand-primary">On Track</span>
                ) : (
                  <span className="text-orange-600">Behind</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Geen actieve doelen</p>
          <p className="text-xs mt-1">Neem contact op met je manager</p>
        </div>
      )}
    </div>
  );
}
