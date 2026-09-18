import { desktopCapturer, ipcMain, systemPreferences, type BrowserWindow } from 'electron'
import { getToolbarWindowForDiagnostics } from './toolbar-window'
import { applyContentProtection, hasRequestedContentProtection } from './window-protection'

export type StealthCheckStatus = 'pass' | 'warning' | 'fail'

export interface StealthCheckItem {
  id: string
  title: string
  status: StealthCheckStatus
  detail: string
  recommendation?: string
}

export interface StealthCompatibilityReport {
  overallStatus: StealthCheckStatus
  platform: NodeJS.Platform
  platformLabel: string
  osVersion: string
  checkedAt: string
  summary: string
  items: StealthCheckItem[]
  manualChecks: string[]
}

function getPlatformLabel(platform: NodeJS.Platform): string {
  if (platform === 'win32') return 'Windows'
  if (platform === 'darwin') return 'macOS'
  return platform
}

function getSystemCheck(osVersion: string): StealthCheckItem {
  if (process.platform === 'win32') {
    const build = Number(osVersion.split('.')[2])
    if (Number.isFinite(build) && build >= 19041) {
      return {
        id: 'system',
        title: '系统防捕获能力',
        status: 'pass',
        detail: `Windows ${osVersion} 支持从捕获源中排除受保护窗口。`
      }
    }

    return {
      id: 'system',
      title: '系统防捕获能力',
      status: 'warning',
      detail: `Windows ${osVersion} 可能只能将受保护窗口显示为黑色，无法完全从列表中排除。`,
      recommendation: '建议升级到 Windows 10 版本 2004 或更高版本。'
    }
  }

  if (process.platform === 'darwin') {
    return {
      id: 'system',
      title: '系统防捕获能力',
      status: 'warning',
      detail: `macOS ${osVersion} 已启用原生防捕获，但部分使用 ScreenCaptureKit 的软件可能不遵循该标记。`,
      recommendation: '请务必在实际使用的视频会议或录屏软件中完成下方人工验证。'
    }
  }

  return {
    id: 'system',
    title: '系统防捕获能力',
    status: 'fail',
    detail: `当前平台 ${process.platform} 不在项目支持范围内。`,
    recommendation: '请在 Windows 或 macOS 上运行。'
  }
}

function getWindowKey(mediaSourceId: string): string {
  return mediaSourceId.split(':').slice(0, 2).join(':')
}

function isBlankThumbnail(bitmap: Buffer): boolean {
  if (bitmap.length < 4) return true

  const pixelCount = Math.max(1, Math.floor(bitmap.length / 4))
  const stride = Math.max(4, Math.floor(bitmap.length / Math.min(pixelCount, 4096) / 4) * 4)
  let darkest = 255
  let brightest = 0
  let sampled = 0

  for (let offset = 0; offset + 2 < bitmap.length; offset += stride) {
    const blue = bitmap[offset]
    const green = bitmap[offset + 1]
    const red = bitmap[offset + 2]
    const lightness = Math.round((red + green + blue) / 3)
    darkest = Math.min(darkest, lightness)
    brightest = Math.max(brightest, lightness)
    sampled += 1
  }

  return sampled === 0 || brightest <= 8 || brightest - darkest <= 3
}

async function getCaptureProbe(windows: BrowserWindow[]): Promise<StealthCheckItem> {
  if (process.platform === 'darwin') {
    const access = systemPreferences.getMediaAccessStatus('screen')
    if (access !== 'granted') {
      return {
        id: 'capture-probe',
        title: '运行时捕获探测',
        status: 'warning',
        detail: `屏幕录制权限状态为“${access}”，无法读取捕获源进行验证。`,
        recommendation: '授权屏幕录制权限后重新运行自检，或直接在会议软件中人工验证。'
      }
    }
  }

  try {
    let timeoutHandle: NodeJS.Timeout | undefined
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('capture probe timeout')), 5000)
    })
    const sources = await (async () => {
      try {
        return await Promise.race([
          desktopCapturer.getSources({
            types: ['window'],
            thumbnailSize: { width: 160, height: 100 },
            fetchWindowIcons: false
          }),
          timeout
        ])
      } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle)
      }
    })()
    const protectedKeys = new Map(
      windows.map((window) => [getWindowKey(window.getMediaSourceId()), window])
    )
    const matches = sources.filter((source) => protectedKeys.has(getWindowKey(source.id)))

    if (matches.length === 0) {
      return {
        id: 'capture-probe',
        title: '运行时捕获探测',
        status: 'pass',
        detail: '应用窗口未出现在 Electron 的窗口捕获源列表中。'
      }
    }

    const hasVisibleThumbnail = matches.some((source) => {
      if (source.thumbnail.isEmpty()) return false
      return !isBlankThumbnail(source.thumbnail.toBitmap())
    })

    if (!hasVisibleThumbnail) {
      return {
        id: 'capture-probe',
        title: '运行时捕获探测',
        status: 'pass',
        detail: '捕获列表可能枚举到窗口，但取得的窗口画面为空白。'
      }
    }

    return {
      id: 'capture-probe',
      title: '运行时捕获探测',
      status: 'warning',
      detail: 'Electron 的捕获源仍能取得应用窗口缩略图。不同会议软件的捕获方式可能不同。',
      recommendation: '请不要仅依赖自动结果，立即在目标会议或录屏软件中人工验证。'
    }
  } catch (error) {
    return {
      id: 'capture-probe',
      title: '运行时捕获探测',
      status: 'warning',
      detail:
        error instanceof Error && error.message === 'capture probe timeout'
          ? '读取窗口捕获源超时。'
          : '无法读取窗口捕获源。',
      recommendation: '请在目标会议或录屏软件中人工验证。'
    }
  }
}

function getOverallStatus(items: StealthCheckItem[]): StealthCheckStatus {
  if (items.some((item) => item.status === 'fail')) return 'fail'
  if (items.some((item) => item.status === 'warning')) return 'warning'
  return 'pass'
}

function getSummary(status: StealthCheckStatus): string {
  if (status === 'pass') return '自动检查全部通过，仍建议在实际共享软件中确认一次。'
  if (status === 'warning') return '基础保护已配置，但存在平台限制或需要人工确认的项目。'
  return '发现会影响隐身效果的问题，请处理失败项目后重新检查。'
}

function getManualChecks(): string[] {
  return [
    '在目标会议软件中共享整个屏幕，确认对方看不到本应用窗口。',
    '切换为“共享窗口”，确认列表中没有本应用；若仍出现，确认预览画面为空白。',
    process.platform === 'darwin'
      ? '使用 macOS 系统录屏或截图再检查一次，尤其关注 ScreenCaptureKit 类型的软件。'
      : '使用 Windows 截图工具或录屏再检查一次。'
  ]
}

export async function runStealthCompatibilityCheck(): Promise<StealthCompatibilityReport> {
  const mainWindow = global.mainWindow
  const toolbarWindow = getToolbarWindowForDiagnostics()
  const windows = [mainWindow, toolbarWindow].filter((window): window is BrowserWindow =>
    Boolean(window && !window.isDestroyed())
  )
  const osVersion = process.getSystemVersion()
  const items: StealthCheckItem[] = [getSystemCheck(osVersion)]

  if (!mainWindow || mainWindow.isDestroyed()) {
    items.push({
      id: 'main-window',
      title: '主窗口状态',
      status: 'fail',
      detail: '无法读取主窗口。',
      recommendation: '重新启动应用后再次运行自检。'
    })
  } else {
    let protectionError: unknown
    try {
      // Reassert protection without briefly disabling it during the diagnostic.
      for (const window of windows) applyContentProtection(window)
    } catch (error) {
      protectionError = error
    }

    const protectionRequested =
      !protectionError && windows.every((window) => hasRequestedContentProtection(window))
    items.push({
      id: 'content-protection',
      title: '原生防捕获标记',
      status: protectionRequested ? 'pass' : 'fail',
      detail: protectionRequested
        ? `已为主窗口${toolbarWindow ? '和悬浮工具条' : ''}重新应用系统级防捕获标记。`
        : '系统级防捕获标记应用失败。',
      recommendation: protectionRequested ? undefined : '重新启动应用；若仍失败，请更新系统和应用。'
    })

    const untitled = windows.every((window) => window.getTitle() === '')
    items.push({
      id: 'window-picker',
      title: '共享窗口列表隐藏',
      status: untitled ? 'pass' : 'fail',
      detail: untitled
        ? '所有应用窗口均保持空标题，可降低出现在浏览器共享窗口列表中的概率。'
        : '至少有一个应用窗口带有标题，可能出现在共享窗口列表中。',
      recommendation: untitled ? undefined : '重新启动应用后再次运行自检。'
    })

    const topMost = windows.every((window) => window.isAlwaysOnTop())
    items.push({
      id: 'overlay-state',
      title: '悬浮窗口状态',
      status: topMost ? 'pass' : 'warning',
      detail: topMost ? '应用窗口保持置顶。' : '至少有一个应用窗口当前未保持置顶。',
      recommendation: topMost ? undefined : '返回主界面并重新显示窗口后再次检查。'
    })

    items.push(await getCaptureProbe(windows))
  }

  const overallStatus = getOverallStatus(items)
  return {
    overallStatus,
    platform: process.platform,
    platformLabel: getPlatformLabel(process.platform),
    osVersion,
    checkedAt: new Date().toISOString(),
    summary: getSummary(overallStatus),
    items,
    manualChecks: getManualChecks()
  }
}

ipcMain.handle('run-stealth-compatibility-check', runStealthCompatibilityCheck)
