import { create } from 'zustand';

interface AppState {
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export const useStore = create<AppState>((set) => ({
  activeTab: 0,
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
