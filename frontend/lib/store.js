import { create } from 'zustand';

export const useAppStore = create((set) => ({
  isLiveConnected: false,
  setLiveConnected: (status) => set({ isLiveConnected: status }),
  
  apiStatus: 'disconnected', // 'connected', 'disconnected', 'degraded'
  setApiStatus: (status) => set({ apiStatus: status }),
  
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    // Auto remove after 5s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));
