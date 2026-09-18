import { create } from 'zustand'

interface AppState {
  ignoreMouse: boolean
  compactMode: boolean
}

interface AppStore extends AppState {
  setIgnoreMouse: (ignore: boolean) => void
  toggleIgnoreMouse: () => void
  syncAppState: (state: AppState) => void
}

const defaultState: AppState = {
  ignoreMouse: false,
  compactMode: false
}

export const useAppStore = create<AppStore>()((set) => ({
  ...defaultState,
  setIgnoreMouse: (ignore) => {
    set({ ignoreMouse: ignore })
  },
  toggleIgnoreMouse: () => {
    set((state) => ({ ignoreMouse: !state.ignoreMouse }))
  },
  syncAppState: (state) => {
    set(state)
  }
}))
