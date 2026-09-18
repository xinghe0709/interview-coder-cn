import { OPACITY_MAX, OPACITY_MIN, TEXT_OPACITY_MIN } from './store/settings'

export const COMPACT_MODE_TEXT_OPACITY = 0.1

export function getWindowOpacityLayers(opacity: number, compactMode = false) {
  const backgroundOpacity = compactMode ? 0 : Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, opacity))
  const contentOpacity = compactMode
    ? COMPACT_MODE_TEXT_OPACITY
    : Math.max(TEXT_OPACITY_MIN, backgroundOpacity)
  const surfaceOpacity = contentOpacity > 0 ? backgroundOpacity / contentOpacity : 0

  return { backgroundOpacity, contentOpacity, surfaceOpacity }
}

/**
 * Chromium opacity affects every descendant. Keep a minimum content opacity,
 * then compensate the large background surfaces with a separate alpha value.
 */
export function applyWindowOpacity(opacity: number, compactMode = false): void {
  const { contentOpacity, surfaceOpacity } = getWindowOpacityLayers(opacity, compactMode)
  document.body.style.opacity = contentOpacity.toString()
  document.documentElement.style.setProperty('--window-surface-opacity', surfaceOpacity.toString())
}

export function clearWindowOpacity(): void {
  document.body.style.opacity = ''
  document.documentElement.style.removeProperty('--window-surface-opacity')
}
