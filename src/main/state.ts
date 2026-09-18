import { ipcMain } from 'electron'

ipcMain.handle('updateAppState', (_event, _state) => {
  Object.assign(state, _state)
})

export const state = {
  inCoderPage: false,
  ignoreMouse: false,
  /** Temporary presentation state; intentionally resets on every app launch */
  compactMode: false
}

export type AppState = typeof state
