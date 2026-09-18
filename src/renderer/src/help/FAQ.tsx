import { BookOpen } from 'lucide-react'
import ShortcutRenderer from '@/components/ShortcutRenderer'
import { platformAlt } from '@/lib/utils/env'
import { HelpSection } from './components'

const faqs = [
  {
    question: '如何截取屏幕截图？',
    answer: (
      <span>
        按下
        <ShortcutRenderer shortcut={`${platformAlt}+Enter`} className="text-xs mx-1" />
        快捷键即可截取当前屏幕的截图。截图会自动显示在应用中。
      </span>
    )
  },
  {
    question: '如何处理题目超过一屏的情况？',
    answer: (
      <span>
        按下
        <ShortcutRenderer shortcut={`${platformAlt}+Shift+Enter`} className="text-xs mx-1" />
        快捷键即可在当前对话中追加截图并生成解题建议。
      </span>
    )
  },
  {
    question: '分享屏幕时，对方能看到应用吗？',
    answer: (
      <span>
        工具会启用系统内容保护，尽量避免窗口出现在常见的屏幕共享结果中，但不同系统、会议软件和捕获方式的表现可能不同。正式使用前请先运行设置页中的“隐身兼容性自检”，并用当前电脑和会议软件做一次实际测试。更多说明请参考{' '}
        <a
          href="https://github.com/xinghe0709/interview-coder-cn#隐身与内容保护说明"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          项目 README
        </a>
        。
      </span>
    )
  },
  {
    question: '鼠标移过窗口时，光标会不会变？',
    answer: (
      <span>
        本工具提供了开关，可以开启或关闭鼠标穿透。开启鼠标穿透时，窗口对鼠标隐身，你需要通过快捷键来操作窗口。切换「鼠标穿透」开关的快捷键是{' '}
        <ShortcutRenderer shortcut={`${platformAlt}+M`} className="text-xs" />{' '}
        。窗口右下角会显示当前状态。
      </span>
    )
  },
  {
    question: '不想用快捷键，可以用鼠标操作吗？',
    answer: (
      <span>
        可以。主窗口上方的「悬浮工具条」把常用操作做成了按钮，点击即可，且不会让做题页面失焦。
        工具条可在「设置 → 界面设置 →
        悬浮工具条」中开启或关闭，各按钮的含义见上方「悬浮工具条」章节。
      </span>
    )
  },
  {
    question: '语音转录功能是什么？如何使用？',
    answer: (
      <span>
        语音转录功能可以实时将面试官的语音或题目朗读转为文字，辅助 AI
        更好地理解题意。使用前需在「设置」中配置百炼平台 API Key，然后按下
        <ShortcutRenderer shortcut={`${platformAlt}+T`} className="text-xs mx-1" />
        开始/暂停转录。转录文本会在截图时自动附带提交给 AI。
      </span>
    )
  },
  {
    question: '转录的文本可以单独清除吗？',
    answer: (
      <span>
        可以。按下
        <ShortcutRenderer shortcut={`${platformAlt}+Shift+T`} className="text-xs mx-1" />
        即可清除当前转录文本，清除后的文本不会提交给 AI。截图时也会自动清除已有转录文本。
      </span>
    )
  }
]

export function FAQ() {
  return (
    <HelpSection Icon={BookOpen} title="常见问题">
      {faqs.map((faq, index) => (
        <div key={index} className="border border-gray-400 rounded-lg p-4">
          <h3 className="font-semibold mb-2">{faq.question}</h3>
          <p className="text-sm text-gray-700">{faq.answer}</p>
        </div>
      ))}
    </HelpSection>
  )
}
