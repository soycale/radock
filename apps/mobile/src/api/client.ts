import { firebaseAuth } from '@/lib/firebase'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL

let authToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback
}

async function refreshFirebaseToken(): Promise<string | null> {
  try {
    const user = firebaseAuth.currentUser
    if (!user) return null
    const token = await user.getIdToken(true) // force refresh
    setAuthToken(token)
    return token
  } catch {
    return null
  }
}

async function request<T>(method: string, path: string, body?: unknown, isRetry = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Token expired — try to refresh once and retry
  if (response.status === 401 && !isRetry) {
    const newToken = await refreshFirebaseToken()
    if (newToken) return request<T>(method, path, body, true)
    // Refresh failed — log out silently, navigation takes over
    onUnauthorized?.()
    return new Promise<T>(() => {})
  }

  if (response.status === 401 && isRetry) {
    // Even after refresh the token was rejected — log out silently
    onUnauthorized?.()
    return new Promise<T>(() => {})
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
