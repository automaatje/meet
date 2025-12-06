import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        isOpen: true,
        confirmText: options.confirmText || 'Bevestigen',
        cancelText: options.cancelText || 'Annuleren',
        type: options.type || 'danger',
        onConfirm: () => {
          setState(null);
          resolve(true);
        },
        onCancel: () => {
          setState(null);
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state?.isOpen && <ConfirmDialog {...state} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog(props: ConfirmState) {
  const typeColors = {
    danger: {
      icon: 'bg-red-100',
      iconColor: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'bg-amber-100',
      iconColor: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      icon: 'bg-blue-100',
      iconColor: 'text-brand-primary',
      button: 'bg-brand-primary hover:opacity-90',
    },
  };

  const colors = typeColors[props.type || 'danger'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-slide-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 ${colors.icon} rounded-full flex items-center justify-center`}>
              <AlertTriangle className={`w-6 h-6 ${colors.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {props.title}
              </h3>
              <p className="text-sm text-gray-600">
                {props.message}
              </p>
            </div>

            <button
              onClick={props.onCancel}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={props.onCancel}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {props.cancelText}
          </button>
          <button
            onClick={props.onConfirm}
            className={`flex-1 ${colors.button} text-white px-4 py-2.5 rounded-lg font-medium transition-colors`}
          >
            {props.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
}
