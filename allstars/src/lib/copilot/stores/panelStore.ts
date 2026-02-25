import { create } from 'zustand'

interface CopilotPanelState {
  isOpen: boolean
  referrerPath: string | null
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  setReferrerPath: (path: string) => void
  clearReferrer: () => void
}

export const useCopilotPanelStore = create<CopilotPanelState>((set) => ({
  isOpen: false,
  referrerPath: null,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  setReferrerPath: (path: string) => set({ referrerPath: path }),
  clearReferrer: () => set({ referrerPath: null }),
}))
