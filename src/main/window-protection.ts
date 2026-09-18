import type { BrowserWindow } from 'electron'

const protectedWindows = new WeakSet<BrowserWindow>()

/**
 * Ask the operating system to exclude a window from capture. Electron does not
 * expose a getter for this state, so remember successful requests for diagnostics.
 */
export function applyContentProtection(window: BrowserWindow, forceReset = false): void {
  if (!window || window.isDestroyed()) return

  if (forceReset && process.platform === 'win32') {
    window.setContentProtection(false)
  }

  window.setContentProtection(true)
  protectedWindows.add(window)
}

/** Whether this process has successfully requested capture protection for a window. */
export function hasRequestedContentProtection(window: BrowserWindow): boolean {
  return protectedWindows.has(window)
}
