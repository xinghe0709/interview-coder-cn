import { streamText, type ModelMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { settings, AppSettings } from './settings'
import { getApiBaseURL, getModelSettingsKey } from '../shared/model-settings'

// The system prompt is fully managed by the renderer (prompt scenes in the
// settings store) and synced here via updateAppSettings on app startup
function getSystemPrompt(extra?: string) {
  return [settings.customPrompt, extra].filter(Boolean).join('\n\n') || undefined
}

function getModel(_settings: AppSettings) {
  const fallbackModel = settings.apiBaseURL.includes('siliconflow')
    ? 'Qwen/Qwen3-VL-32B-Instruct'
    : 'gpt-5-mini'
  return _settings.model || fallbackModel
}

function getStreamOptions() {
  const model = getModel(settings)
  const reasoningEffort = settings.reasoningEfforts[getModelSettingsKey(settings.apiBaseURL, model)]
  return {
    model: createOpenAI({
      baseURL: getApiBaseURL(settings.apiBaseURL),
      apiKey: settings.apiKey,
      ...(reasoningEffort
        ? {
            fetch: (input: RequestInfo | URL, init?: RequestInit) => {
              if (typeof init?.body !== 'string') {
                throw new Error('无法设置思考强度：请求格式不支持')
              }
              const body = JSON.parse(init.body) as Record<string, unknown>
              return fetch(input, {
                ...init,
                body: JSON.stringify({ ...body, reasoning_effort: reasoningEffort })
              })
            }
          }
        : {})
    }).chat(model)
  }
}

export function getSolutionStream(messages: ModelMessage[], abortSignal?: AbortSignal) {
  const { textStream } = streamText({
    ...getStreamOptions(),
    system: getSystemPrompt(),
    messages,
    abortSignal,
    onError: (err) => {
      throw err.error ?? err
    }
  })
  return textStream
}

export function getFollowUpStream(
  messages: ModelMessage[],
  userQuestion: string,
  abortSignal?: AbortSignal
) {
  // Add the user's follow-up question to the conversation
  const updatedMessages: ModelMessage[] = [
    ...messages,
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: userQuestion
        }
      ]
    }
  ]

  const { textStream } = streamText({
    ...getStreamOptions(),
    system: getSystemPrompt(),
    messages: updatedMessages,
    abortSignal,
    onError: (err) => {
      throw err.error ?? err
    }
  })
  return textStream
}

export function getGeneralStream(messages: ModelMessage[], abortSignal?: AbortSignal) {
  const { textStream } = streamText({
    ...getStreamOptions(),
    system: getSystemPrompt(
      '注意：如果有多张截图，请结合所有截图内容进行完整分析，不要遗漏任何部分。'
    ),
    messages,
    abortSignal,
    onError: (err) => {
      throw err.error ?? err
    }
  })
  return textStream
}
