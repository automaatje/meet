import { ReactNode } from 'react';
import { Users, Briefcase, Ruler, Image, FileText } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'customers' | 'projects' | 'measurements' | 'photos' | 'quotes';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
  const icons = {
    customers: Users,
    projects: Briefcase,
    measurements: Ruler,
    photos: Image,
    quotes: FileText,
  };

  const Icon = icon ? icons[icon] : null;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border-2 border-dashed border-gray-200">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-sm">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="bg-brand-primary text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-all"
        >
          {action.label}
        </button>
      )}

      {children}
    </div>
  );
}
