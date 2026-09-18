import { useEffect, useState } from 'react'
import { HelpCircle, Minimize2, SettingsIcon, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store/app'

export function AppHeader() {
  const navigate = useNavigate()
  const { ignoreMouse } = useAppStore()
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion)
  }, [])

  return (
    <div id="app-header" className="flex items-center text-white">
      <div className="mx-auto flex items-baseline gap-1.5">
        <span>截屏解题助手</span>
        {appVersion && <span className="text-[10px] opacity-60">v{appVersion}</span>}
      </div>
      <div className={`actions ${ignoreMouse ? 'pointer-events-none' : ''}`}>
        <Button
          variant="ghost"
          className="size-8 cursor-pointer hover:opacity-50"
          aria-label="进入极简隐身模式"
          onClick={() => void window.api.toggleCompactMode()}
        >
          <Minimize2 />
        </Button>
        <Button
          variant="ghost"
          className="size-8 cursor-pointer hover:opacity-50"
          aria-label="打开设置"
          onClick={() => navigate('/settings')}
        >
          <SettingsIcon />
        </Button>
        <Button
          variant="ghost"
          className="size-8 cursor-pointer hover:opacity-50"
          aria-label="打开帮助中心"
          onClick={() => navigate('/help')}
        >
          <HelpCircle />
        </Button>
        <Button
          variant="ghost"
          className="size-8 cursor-pointer hover:opacity-50 hover:text-red-500"
          aria-label="关闭应用"
          onClick={() => window.close()}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
