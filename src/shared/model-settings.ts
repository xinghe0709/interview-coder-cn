export type ReasoningEffort = string

export function getApiBaseURL(baseURL: string): string {
  const input = baseURL.trim() || 'https://api.openai.com/v1'
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error('请输入有效的 HTTP(S) API Base URL')
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('请输入有效的 HTTP(S) API Base URL')
  }
  const path = url.pathname.replace(/\/+$/, '')
  url.pathname = path || (baseURL.trim() ? '/' : '/v1')
  return url.toString().replace(/\/+$/, '')
}

export function getProviderKey(baseURL: string): string {
  try {
    return getApiBaseURL(baseURL)
  } catch {
    return baseURL.trim()
  }
}

export function getModelSettingsKey(baseURL: string, model: string): string {
  return JSON.stringify([getProviderKey(baseURL), model])
}
