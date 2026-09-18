# Interview Coder CN

一个面向 macOS 和 Windows 的透明悬浮式 AI 屏幕助手。它可以通过全局快捷键截取屏幕、调用兼容 OpenAI API 的视觉模型，并以流式方式展示分析结果。

> 本项目仅供学习、辅助分析和技术研究。请遵守所在学校、公司、面试平台和考试平台的规则，不要将其用于作弊、欺诈或其他违规行为。

## 功能概览

- **截图分析**：新建截图会开启一轮对话，追加截图可保留上下文，也支持继续追问。
- **Prompt 场景**：内置算法题、英语考试、能力测评和通用问答，可添加自定义场景并通过快捷键循环切换。
- **透明悬浮窗口**：窗口始终置顶，背景透明度可降至 0；答案文字颜色可单独设置，代码块背景会随主背景协调变化。
- **极简模式**：隐藏标题栏和辅助区域，仅保留低可见度答案文字，适合小尺寸悬浮显示。
- **截图展示控制**：可隐藏主界面的截图图片，同时继续把截图发送给 AI。
- **悬浮工具条与鼠标穿透**：支持鼠标操作、悬停触发，也可让鼠标事件穿过窗口。
- **语音转录**：可使用阿里云百炼 Fun-ASR 实时转录系统音频，并在截图时附带给 AI。
- **隐身兼容性自检**：检查当前系统上的内容保护、窗口透明度和关键运行条件，并提示仍需手工验证的项目。
- **跨平台构建**：支持 macOS 和 Windows；Linux 暂不支持。

## 快速开始

### 环境要求

- Node.js 22 或更高版本
- npm
- 支持图片输入的 OpenAI 兼容模型及 API Key

这是 Electron/Node.js 项目，不需要 Python、Poetry、CMake 或 `pyproject.toml`。

### 安装与运行

```bash
git clone https://github.com/xinghe0709/interview-coder-cn.git
cd interview-coder-cn
npm install
npm run dev
```

应用启动后进入“设置”，填写 API 地址、API Key 和模型名称。推荐优先通过界面保存配置。

也可以在项目根目录创建 `.env` 作为首次启动的默认配置：

```env
API_BASE_URL="https://openrouter.ai/api/v1"
API_KEY="sk-your-key"
MODEL="gpt-5-mini"
```

`.env` 已被 Git 忽略。不要把真实密钥提交到仓库或粘贴到 Issue。

## 默认快捷键

macOS 使用 `Option`，Windows 使用 `Ctrl`。所有快捷键都可以在设置中修改。

| 功能               | macOS                    | Windows                |
| ------------------ | ------------------------ | ---------------------- |
| 截图并新建对话     | `Option + Enter`         | `Ctrl + Enter`         |
| 追加截图           | `Option + Shift + Enter` | `Ctrl + Shift + Enter` |
| 隐藏或显示窗口     | `Option + H`             | `Ctrl + H`             |
| 切换极简模式       | `Option + Shift + H`     | `Ctrl + Shift + H`     |
| 切换鼠标穿透       | `Option + M`             | `Ctrl + M`             |
| 切换 Prompt 场景   | `Option + P`             | `Ctrl + P`             |
| 开始或暂停语音转录 | `Option + T`             | `Ctrl + T`             |
| 停止 AI 输出       | `Option + .`             | `Ctrl + .`             |

## 透明度与显示设置

- **背景透明度**：普通模式可降至完全透明，内容仍保留最低可见度。
- **答案文字颜色**：提供预设颜色和 HEX 输入，白色网页上建议使用浅灰或深灰。
- **截图图片**：关闭“展示截图图片”后，只隐藏界面预览，不影响截图提交给 AI。
- **极简模式**：使用独立的纯透明背景和低可见度文字显示，不受普通模式答案颜色影响。

## 语音转录

语音转录使用阿里云百炼 Fun-ASR，需要单独的 DashScope API Key：

1. 在阿里云百炼控制台创建 API Key。
2. 在“设置 → 语音转录”中填写 Key。
3. 使用转录快捷键开始或暂停。
4. 下一次截图时，当前转录文本会和截图一起发送给模型，随后自动清空。

## 隐身与内容保护说明

应用会使用 Electron 的内容保护能力，尽量避免窗口出现在常见的屏幕共享或截图结果中，但这不是对所有软件、所有捕获方式和所有系统版本的保证。

正式使用前请运行设置页中的“隐身兼容性自检”，并在实际使用的会议软件中完成一次端到端测试。物理相机拍摄、部分系统级录屏方式或未来的软件更新仍可能捕获窗口。

## 开发命令

```bash
npm run dev          # 开发模式
npm run typecheck    # TypeScript 检查
npm run lint         # ESLint
npm run build        # 类型检查并构建
npm run build:mac    # 构建 macOS 安装包
npm run build:win    # 构建 Windows 安装包
```

主要目录：

```text
src/main/              Electron 主进程、快捷键、截图、AI 与窗口管理
src/preload/           安全的 IPC 桥接
src/renderer/src/      React 界面、设置页和 Zustand 状态
.github/workflows/     GitHub Actions 构建与发布
```

## 发布

推送形如 `v1.0.0` 的 tag 会触发 GitHub Actions，在 macOS 和 Windows 上构建安装包，并创建一条草稿 Release。正式发布前应分别在真实 macOS 与 Windows 设备上验证透明窗口、全局快捷键、截图权限和内容保护。

## 许可证与署名

本项目使用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh) 许可，仅允许非商业使用，具体条款见 [LICENSE](./LICENSE)。

本项目基于 [ooboqoo/interview-coder-cn](https://github.com/ooboqoo/interview-coder-cn) 修改，当前版本加入了极简透明显示、独立背景与文字样式、Prompt 快捷切换、隐身兼容性自检、截图预览控制等功能。重新建立 Git 历史不会改变原项目许可证要求的署名义务。
