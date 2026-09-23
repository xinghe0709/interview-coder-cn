import { getApiBaseURL } from '../shared/model-settings'

export class ModelFetchError extends Error {}

export async function fetchAvailableModels(baseURL: string, apiKey: string): Promise<string[]> {
  if (!apiKey.trim()) throw new ModelFetchError('请先填写 API Key')

  let url: string
  try {
    url = `${getApiBaseURL(baseURL)}/models`
  } catch {
    throw new ModelFetchError('请输入有效的 HTTP(S) API Base URL')
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    signal: AbortSignal.timeout(10000)
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ModelFetchError('获取模型失败：API Key 无效或没有访问权限')
    }
    throw new ModelFetchError(`获取模型失败：HTTP ${response.status}，请检查 API 地址及权限`)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ModelFetchError('模型列表响应格式不正确')
  }
  if (!body || typeof body !== 'object' || !('data' in body) || !Array.isArray(body.data)) {
    throw new ModelFetchError('模型列表响应格式不正确')
  }

  const models = [
    ...new Set(
      body.data
        .map((entry: unknown) =>
          entry && typeof entry === 'object' && 'id' in entry && typeof entry.id === 'string'
            ? entry.id.trim()
            : ''
        )
        .filter(Boolean)
    )
  ].sort((first, second) => first.localeCompare(second))

  if (!models.length) throw new ModelFetchError('接口未返回可用模型，请确认 API Key 权限')
  return models
}
