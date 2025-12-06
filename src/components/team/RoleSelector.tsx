import React from 'react';
import { Crown, Shield, TrendingUp, Users, MapPin, Phone, Target, Eye, User, CheckCircle } from 'lucide-react';
import { Role, ROLE_COLORS, ROLE_DESCRIPTIONS, ROLE_ONBOARDING } from '../../lib/permissions';

interface RoleSelectorProps {
  value: Role;
  onChange: (role: Role) => void;
  showOnboarding?: boolean;
  disabled?: boolean;
}

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  owner: <Crown className="w-5 h-5" />,
  admin: <Shield className="w-5 h-5" />,
  head_of_sales: <TrendingUp className="w-5 h-5" />,
  sales_manager: <Users className="w-5 h-5" />,
  account_manager_field: <MapPin className="w-5 h-5" />,
  commercial_inside: <Phone className="w-5 h-5" />,
  field_marketeer: <Target className="w-5 h-5" />,
  employee: <User className="w-5 h-5" />,
  viewer: <Eye className="w-5 h-5" />,
};

const ROLE_ORDER: Role[] = [
  'owner',
  'admin',
  'head_of_sales',
  'sales_manager',
  'account_manager_field',
  'commercial_inside',
  'field_marketeer',
  'employee',
  'viewer',
];

export function RoleSelector({ value, onChange, showOnboarding = false, disabled = false }: RoleSelectorProps) {
  const selectedOnboarding = showOnboarding ? ROLE_ONBOARDING[value] : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {ROLE_ORDER.map((role) => {
          const colors = ROLE_COLORS[role];
          const isSelected = value === role;

          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(role)}
              disabled={disabled}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <div className={colors.text}>{ROLE_ICONS[role]}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{colors.label}</span>
                    {isSelected && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{ROLE_DESCRIPTIONS[role]}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedOnboarding && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {selectedOnboarding.welcome}
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Toegang tot:</h4>
              <ul className="space-y-1">
                {selectedOnboarding.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Eerste stappen:</h4>
              <ol className="space-y-1">
                {selectedOnboarding.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="font-semibold text-brand-primary flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
