import { create } from 'zustand';

interface NavigationState {
    onLocateClick: (() => void) | null;
    locating: boolean;
    setLocateAction: (action: (() => void) | null) => void;
    setLocating: (locating: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    onLocateClick: null,
    locating: false,
    setLocateAction: (onLocateClick) => set({ onLocateClick }),
    setLocating: (locating) => set({ locating }),
}));
