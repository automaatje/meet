import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import InstallPrompt from './InstallPrompt';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
