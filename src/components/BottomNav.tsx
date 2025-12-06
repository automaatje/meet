import { Home, Users, Briefcase, Clipboard, Receipt, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';

const tabs = [
  { icon: Home, label: 'Home', index: 0 },
  { icon: Users, label: 'Klanten', index: 1 },
  { icon: Briefcase, label: 'Projecten', index: 2 },
  { icon: Clipboard, label: 'Bonnen', index: 3 },
  { icon: Receipt, label: 'Facturen', index: 4 },
  { icon: Settings, label: 'Meer', index: 5 },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around px-1">
        {tabs.map(({ icon: Icon, label, index }) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex flex-col items-center justify-center flex-1 min-h-[64px] py-2 px-1 transition-colors active:bg-gray-50 ${
              activeTab === index
                ? 'text-brand-primary'
                : 'text-gray-500'
            }`}
            aria-label={label}
          >
            <Icon className="w-6 h-6 mb-1 flex-shrink-0" />
            <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
