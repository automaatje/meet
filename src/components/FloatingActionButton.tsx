import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 bg-brand-primary hover:opacity-90 active:opacity-80 text-white rounded-full p-4 shadow-lg transition-all z-40 min-h-[56px] min-w-[56px] flex items-center justify-center active:scale-95"
      aria-label="Nieuw project"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
