import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  SquareTerminal,
  Palette,
  Shield,
  Bot,
  Eye,
  EyeOff,
  Keyboard,
  FolderOpen,
  Mic,
  Plus,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  useSettingsStore,
  PRESET_SCENE_PROMPTS,
  type ScreenshotDisplay,
  OPACITY_MIN,
  OPACITY_MAX,
  OPACITY_STEP
} from '@/lib/store/settings'
import { isMac } from '@/lib/utils/env'
import { applyWindowOpacity, clearWindowOpacity } from '@/lib/window-opacity'
import { SelectModel } from './SelectModel'
import { CustomShortcuts, ResetDefaultShortcuts } from './CustomShortcuts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type StealthCompatibilityReport = Awaited<ReturnType<Window['api']['runStealthCompatibilityCheck']>>
type StealthCheckStatus = StealthCompatibilityReport['overallStatus']

const stealthStatusMeta: Record<
  StealthCheckStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  pass: {
    label: '通过',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2
  },
  warning: {
    label: '需确认',
    className: 'border-amber-300 bg-amber-50 text-amber-800',
    icon: AlertTriangle
  },
  fail: {
    label: '未通过',
    className: 'border-red-300 bg-red-50 text-red-800',
    icon: XCircle
  }
}

const ANSWER_TEXT_COLOR_PRESETS = [
  { label: '默认', value: '#f3f4f6' },
  { label: '浅灰', value: '#9ca3af' },
  { label: '深灰', value: '#4b5563' },
  { label: '白底可见', value: '#111827' }
] as const

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  return /^#[0-9a-f]{6}$/i.test(withHash) ? withHash.toLowerCase() : null
}

export default function SettingsPage() {
  const {
    opacity,
    answerTextColor,
    resizable,
    showOverlayToolbar,
    toolbarHoverDelay,
    showScreenshotPreview,
    screenshotDisplay,
    apiBaseURL,
    apiKey,
    model,
    scenes,
    activeSceneId,
    screenshotAutoSave,
    screenshotDir,
    dashscopeApiKey,
    audioInputDeviceId,
    audioOutputDeviceId,
    hideDockIcon,
    updateSetting,
    setActiveScene,
    updateScenePrompt,
    addScene,
    removeScene
  } = useSettingsStore()
  const [showApiKey, setShowApiKey] = useState(false)
  const [showDashscopeApiKey, setShowDashscopeApiKey] = useState(false)
  const [addSceneOpen, setAddSceneOpen] = useState(false)
  const [newSceneName, setNewSceneName] = useState('')
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null)
  const [stealthReport, setStealthReport] = useState<StealthCompatibilityReport | null>(null)
  const [stealthCheckRunning, setStealthCheckRunning] = useState(false)
  const [stealthCheckError, setStealthCheckError] = useState('')
  const [answerTextColorDraft, setAnswerTextColorDraft] = useState(answerTextColor.toUpperCase())

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])

  const activeScene = scenes.find((s) => s.id === activeSceneId)
  const deletingScene = scenes.find((s) => s.id === sceneToDelete)

  useEffect(() => {
    setAnswerTextColorDraft(answerTextColor.toUpperCase())
  }, [answerTextColor])

  useEffect(() => {
    return clearWindowOpacity
  }, [])

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const needsPermission = devices.every((d) => !d.label)
        if (needsPermission) {
          await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        }
        const refreshed = await navigator.mediaDevices.enumerateDevices()
        setAudioDevices(refreshed)
      } catch (err) {
        console.error('Failed to enumerate audio devices:', err)
      }
    }
    loadDevices()
  }, [])

  const handleAddScene = () => {
    const name = newSceneName.trim()
    if (!name) return
    addScene(name)
    setNewSceneName('')
    setAddSceneOpen(false)
  }

  const handleResetScenePrompt = () => {
    if (!activeScene?.isPreset) return
    updateScenePrompt(activeScene.id, PRESET_SCENE_PROMPTS[activeScene.id] ?? '')
  }

  const handleStealthCheck = async () => {
    setStealthCheckRunning(true)
    setStealthCheckError('')
    try {
      setStealthReport(await window.api.runStealthCompatibilityCheck())
    } catch (error) {
      console.error('Failed to run stealth compatibility check:', error)
      setStealthCheckError('自检运行失败，请重新启动应用后再试。')
    } finally {
      setStealthCheckRunning(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div id="app-header" className="flex items-center">
        <div className="actions">
          <Button variant="ghost" asChild size="icon" className="w-12 mr-2 rounded-none">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <h1>设置</h1>
      </div>

      {/* Settings Content */}
      <div id="app-content" className="flex flex-col gap-4 p-8">
        {/* AI Settings */}
        <div className="bg-gray-300/80 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            AI 设置
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                API Base URL
                <span className="ml-2 text-xs font-light">
                  如硅基流动为 https://api.siliconflow.cn/v1
                </span>
              </label>
              <input
                type="text"
                value={apiBaseURL}
                onChange={(e) => updateSetting('apiBaseURL', e.target.value)}
                className="w-60 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="可为空，默认使用 OpenAI 的 API"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">API Key</label>
              <div className="flex items-center w-60">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => updateSetting('apiKey', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入 API Key"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="border border-l-0 rounded-l-none rounded-r-md h-9 w-9 hover:border-none"
                >
                  {showApiKey ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Model
                <span className="ml-2 text-xs font-light">
                  这里列了几个流行的国内和国外模型，请自行确认你的平台是否支持
                </span>
              </label>
              <SelectModel value={model} onChange={(val) => updateSetting('model', val)} />
            </div>
          </div>
        </div>
        {/* Transcription Settings */}
        <div className="bg-gray-300/80 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            语音转录
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                百炼平台 API Key
                <span className="ml-2 text-xs font-light">
                  从阿里云
                  <a
                    href="https://bailian.console.aliyun.com/cn-beijing?tab=model#/api-key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-0.5 text-blue-700 hover:underline"
                  >
                    百炼平台
                  </a>
                  获取，如不需要语音转录功能可跳过
                </span>
              </label>
              <div className="flex items-center w-60">
                <input
                  type={showDashscopeApiKey ? 'text' : 'password'}
                  value={dashscopeApiKey}
                  onChange={(e) => updateSetting('dashscopeApiKey', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入百炼平台 API Key"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDashscopeApiKey(!showDashscopeApiKey)}
                  className="border border-l-0 rounded-l-none rounded-r-md h-9 w-9 hover:border-none"
                >
                  {showDashscopeApiKey ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                音频输入设备
                <span className="ml-2 text-xs font-light">选择麦克风，留空则捕获系统音频</span>
              </label>
              <Select
                value={audioInputDeviceId || 'system'}
                onValueChange={(val) =>
                  updateSetting('audioInputDeviceId', val === 'system' ? '' : val)
                }
              >
                <SelectTrigger className="w-60 bg-white">
                  <SelectValue placeholder="系统音频（默认）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">系统音频（默认）</SelectItem>
                  {audioDevices
                    .filter((d) => d.kind === 'audioinput')
                    .map((d) => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>
                        {d.label || d.deviceId}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                音频输出设备
                <span className="ml-2 text-xs font-light">用于转录时的监听输出</span>
              </label>
              <Select
                value={audioOutputDeviceId || 'default'}
                onValueChange={(val) =>
                  updateSetting('audioOutputDeviceId', val === 'default' ? '' : val)
                }
              >
                <SelectTrigger className="w-60 bg-white">
                  <SelectValue placeholder="默认设备" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认设备</SelectItem>
                  {audioDevices
                    .filter((d) => d.kind === 'audiooutput')
                    .map((d) => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>
                        {d.label || d.deviceId}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="bg-gray-300/80 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <SquareTerminal className="h-5 w-5 mr-2" />
            解题设置
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                使用场景
                <span className="ml-2 text-xs font-light">
                  选择场景后可编辑对应的系统提示词，修改会自动保存；也可新增自己的场景
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={cn(
                      'group flex items-center rounded-full border text-sm transition-colors cursor-pointer select-none',
                      scene.id === activeSceneId
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    )}
                    onClick={() => setActiveScene(scene.id)}
                  >
                    <span className={cn('py-1 pl-3', scene.isPreset ? 'pr-3' : 'pr-1')}>
                      {scene.name}
                    </span>
                    {!scene.isPreset && (
                      <button
                        className="mr-1.5 p-0.5 rounded-full opacity-60 hover:opacity-100 hover:bg-black/10"
                        title="删除该场景"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSceneToDelete(scene.id)
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="flex items-center gap-1 rounded-full border border-dashed border-gray-400 bg-transparent px-3 py-1 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  onClick={() => setAddSceneOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  新增场景
                </button>
              </div>
            </div>

            {activeScene && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">
                    系统提示词
                    <span className="ml-2 text-xs font-light">「{activeScene.name}」场景</span>
                  </label>
                  {activeScene.isPreset && (
                    <button
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                      title="恢复该场景的默认提示词"
                      onClick={handleResetScenePrompt}
                    >
                      <RotateCcw className="h-3 w-3" />
                      恢复默认
                    </button>
                  )}
                </div>
                <Textarea
                  value={activeScene.prompt}
                  onChange={(e) => updateScenePrompt(activeScene.id, e.target.value)}
                  placeholder="请输入该场景的系统提示词, 示例: 你是一个解题助手, 请根据「截图」和「语音转录内容」给出相关回答。"
                  className="w-full min-h-24 max-h-100 bg-white"
                  rows={6}
                />
              </div>
            )}
          </div>
        </div>

        {/* Add scene dialog */}
        <Dialog open={addSceneOpen} onOpenChange={setAddSceneOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>新增场景</DialogTitle>
              <DialogDescription>创建后可为该场景编写专属的系统提示词</DialogDescription>
            </DialogHeader>
            <Input
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="场景名称，如：数学考试"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddScene()
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddSceneOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddScene} disabled={!newSceneName.trim()}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete scene confirm dialog */}
        <Dialog open={!!sceneToDelete} onOpenChange={(open) => !open && setSceneToDelete(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>删除场景</DialogTitle>
              <DialogDescription>
                确定删除场景「{deletingScene?.name}」吗？其提示词内容将一并删除，且无法恢复。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSceneToDelete(null)}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (sceneToDelete) removeScene(sceneToDelete)
                  setSceneToDelete(null)
                }}
              >
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Appearance Settings */}
        <div className="bg-gray-300/80 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            界面设置
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                窗口透明度
                <span className="ml-2 text-xs font-light">
                  背景可完全透明，文字最低保留 5% 可见度；也可在主界面用快捷键调节
                </span>
              </label>
              <div className="w-60 flex items-center gap-2">
                <span className="text-xs whitespace-nowrap">透明</span>
                <Slider
                  min={OPACITY_MIN}
                  max={OPACITY_MAX}
                  step={OPACITY_STEP}
                  value={[opacity]}
                  onValueChange={(value) => {
                    updateSetting('opacity', value[0])
                    applyWindowOpacity(value[0])
                  }}
                />
                <span className="text-xs whitespace-nowrap">不透明</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-6">
              <label className="text-sm font-medium">
                答案文字颜色
                <span className="ml-2 text-xs font-light">
                  仅影响正常模式的 AI 输出；纯白页面建议使用“白底可见”
                </span>
              </label>
              <div className="w-80 space-y-2">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {ANSWER_TEXT_COLOR_PRESETS.map((preset) => {
                    const selected = answerTextColor.toLowerCase() === preset.value
                    return (
                      <Button
                        key={preset.value}
                        type="button"
                        variant={selected ? 'secondary' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-8 px-2.5',
                          selected ? 'border border-gray-900 bg-gray-100' : 'bg-white'
                        )}
                        aria-pressed={selected}
                        onClick={() => updateSetting('answerTextColor', preset.value)}
                      >
                        <span
                          className="size-3 rounded-sm border border-black/20"
                          style={{ backgroundColor: preset.value }}
                          aria-hidden="true"
                        />
                        {preset.label}
                      </Button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span
                    className="size-6 shrink-0 rounded-md border border-black/20"
                    style={{ backgroundColor: answerTextColor }}
                    aria-hidden="true"
                  />
                  <Input
                    value={answerTextColorDraft}
                    maxLength={7}
                    spellCheck={false}
                    aria-label="自定义答案文字颜色"
                    aria-describedby="answer-text-color-hint"
                    className="h-8 w-28 bg-white font-mono text-xs uppercase"
                    onChange={(event) => {
                      const nextValue = event.target.value.toUpperCase()
                      setAnswerTextColorDraft(nextValue)
                      const normalized = normalizeHexColor(nextValue)
                      if (normalized) updateSetting('answerTextColor', normalized)
                    }}
                    onBlur={() => {
                      const normalized = normalizeHexColor(answerTextColorDraft)
                      setAnswerTextColorDraft((normalized ?? answerTextColor).toUpperCase())
                    }}
                  />
                  <span id="answer-text-color-hint" className="text-xs text-gray-600">
                    输入 #RRGGBB
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                允许调整主窗口大小
                <span className="ml-2 text-xs font-light">
                  关闭后鼠标移到窗口边缘不再出现缩放光标
                </span>
              </label>
              <Switch
                className="scale-y-90"
                checked={resizable}
                onCheckedChange={(checked) => updateSetting('resizable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                展示截图图片
                <span className="ml-2 text-xs font-light">
                  关闭后主界面不显示截图，但截图仍会正常发送给 AI
                </span>
              </label>
              <Switch
                className="scale-y-90"
                checked={showScreenshotPreview}
                onCheckedChange={(checked) => updateSetting('showScreenshotPreview', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className={cn('text-sm font-medium', !showScreenshotPreview && 'opacity-50')}>
                截图展示方式
                <span className="ml-2 text-xs font-light">
                  开启展示后，选择缩略图或只显示截图数量
                </span>
              </label>
              <Select
                value={screenshotDisplay}
                disabled={!showScreenshotPreview}
                onValueChange={(val) =>
                  updateSetting('screenshotDisplay', val as ScreenshotDisplay)
                }
              >
                <SelectTrigger className="w-60 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">卡片显示截图数量</SelectItem>
                  <SelectItem value="gallery">显示全部缩略图（默认）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                悬浮工具条
                <span className="ml-2 text-xs font-light">
                  在主窗口上方显示一排按钮，可用鼠标点击替代快捷键操作，详见帮助中心
                </span>
              </label>
              <Switch
                className="scale-y-90"
                checked={showOverlayToolbar}
                onCheckedChange={(checked) => updateSetting('showOverlayToolbar', checked)}
              />
            </div>

            {showOverlayToolbar && (
              <div className="flex items-center justify-between pl-4 border-l-2 border-gray-400/70">
                <label className="text-sm font-medium">
                  悬停触发
                  <span className="ml-2 text-xs font-light">
                    鼠标在按钮上停留指定时间即触发，无需点击；停留过程中按钮下方有进度条
                  </span>
                </label>
                <Select
                  value={String(toolbarHoverDelay)}
                  onValueChange={(val) => updateSetting('toolbarHoverDelay', Number(val))}
                >
                  <SelectTrigger className="w-60 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">关闭（仅点击触发）</SelectItem>
                    <SelectItem value="500">停留 0.5 秒</SelectItem>
                    <SelectItem value="1000">停留 1 秒</SelectItem>
                    <SelectItem value="2000">停留 2 秒</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Shortcuts Settings */}
        <div className="bg-gray-300/80 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Keyboard className="h-5 w-5 mr-2" />
            快捷键设置
            <div className="text-sm font-light ml-2 mt-1">
              只有在主界面时，快捷键才有效。当前页面仅部分快捷键生效。
            </div>
            <ResetDefaultShortcuts />
          </h2>
          <CustomShortcuts />
        </div>

        {/* Screenshot Save Settings */}
        <div className="bg-gray-300/80 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            保存截图
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                保存截图到本地
                <span className="ml-2 text-xs font-light">
                  开启后，每次截图都会自动保存到指定目录
                </span>
              </label>
              <Switch
                className="scale-y-90"
                checked={screenshotAutoSave}
                onCheckedChange={(checked) => updateSetting('screenshotAutoSave', checked)}
              />
            </div>
            {screenshotAutoSave && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  保存目录
                  <span className="ml-2 text-xs font-light">
                    可点击右侧内容重新选择保存目录（选择弹窗可能被本窗口遮挡）
                  </span>
                </label>
                <button
                  className="text-xs text-gray-600 max-w-48 truncate hover:text-gray-900 cursor-pointer transition-colors"
                  title="点击选择保存目录"
                  onClick={async () => {
                    const dir = await window.api.selectScreenshotDir()
                    if (dir) updateSetting('screenshotDir', dir)
                  }}
                >
                  {screenshotDir || '默认: 图片/InterviewCoder'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-gray-300/80 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            隐私设置
          </h2>

          <div className="space-y-4">
            <p className="text-sm">
              此应用在本地运行，采集的图片会直接发送到您配置的大模型服务商，不经过其他中转服务。请同时确认所用服务商的数据与隐私政策。
            </p>

            <div className="rounded-lg border border-gray-400/70 bg-white/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">隐身兼容性自检</h3>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    检查系统支持、窗口防捕获标记、共享列表隐藏和运行时捕获结果。
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStealthCheck}
                  disabled={stealthCheckRunning}
                >
                  {stealthCheckRunning ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  {stealthCheckRunning ? '检查中' : stealthReport ? '重新检查' : '开始检查'}
                </Button>
              </div>

              {stealthCheckError && (
                <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {stealthCheckError}
                </p>
              )}

              {stealthReport && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const meta = stealthStatusMeta[stealthReport.overallStatus]
                      const StatusIcon = meta.icon
                      return (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                            meta.className
                          )}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                      )
                    })()}
                    <span className="text-xs text-gray-600">
                      {stealthReport.platformLabel} {stealthReport.osVersion}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(stealthReport.checkedAt).toLocaleString('zh-CN')}
                    </span>
                  </div>

                  <p className="text-sm font-medium">{stealthReport.summary}</p>

                  <div className="grid gap-2">
                    {stealthReport.items.map((item) => {
                      const meta = stealthStatusMeta[item.status]
                      const StatusIcon = meta.icon
                      return (
                        <div
                          key={item.id}
                          className={cn('rounded-md border px-3 py-2.5', meta.className)}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <StatusIcon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <span className="ml-auto text-xs font-normal">{meta.label}</span>
                          </div>
                          <p className="mt-1 text-xs leading-5">{item.detail}</p>
                          {item.recommendation && (
                            <p className="mt-1 text-xs leading-5 font-medium">
                              建议：{item.recommendation}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-blue-900">
                    <p className="text-xs font-semibold">最后请完成人工验证</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs leading-5">
                      {stealthReport.manualChecks.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {isMac && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  隐藏 Dock 图标
                  <span className="ml-2 text-xs font-light">
                    开启后不在程序坞和 Cmd+Tab 切换器中显示，仅可通过快捷键唤起窗口
                  </span>
                </label>
                <Switch
                  className="scale-y-90"
                  checked={hideDockIcon}
                  onCheckedChange={(checked) => updateSetting('hideDockIcon', checked)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
