import { useAuthStore } from '../stores/authStore'
import type { LoginResponse } from './types'

// 개발: Vite proxy, 운영: nginx 가 /api 를 백엔드로 넘겨줌
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/** 만료 이만큼 전이면 미리 새 토큰을 받는다 */
const REFRESH_EARLY_MS = 30_000

export interface FieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: FieldError[]

  constructor(status: number, code: string, message: string, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

type ErrorBody = Partial<{ code: string; message: string; fieldErrors: FieldError[] }>

let refreshing: Promise<boolean> | null = null

/**
 * 리프레시 쿠키로 새 액세스 토큰을 받는다. 동시에 여러 요청이 401 을 받아도 한 번만 부른다.
 * 실패하면(쿠키 없음 · 만료 · 로그아웃됨) 로그아웃 상태로 바꾼다.
 */
export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('refresh failed')
      useAuthStore.getState().setLogin((await res.json()) as LoginResponse)
      return true
    } catch {
      useAuthStore.getState().logout()
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/** 로그인한 회원인데 액세스 토큰이 없거나 곧 만료되면 먼저 새로 받는다 */
async function ensureFreshToken() {
  const { member, accessToken, expiresAt } = useAuthStore.getState()
  if (!member) return
  if (!accessToken || !expiresAt || expiresAt - Date.now() < REFRESH_EARLY_MS) await refreshAccessToken()
}

async function send(method: string, path: string, body: unknown, isForm: boolean) {
  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include', // 로그인 · 로그아웃 때 리프레시 쿠키를 주고받는다
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다.')
  }
}

async function request<T>(method: string, path: string, body?: unknown, isForm = false): Promise<T> {
  const isAuthCall = path.startsWith('/api/auth/')
  if (!isAuthCall) await ensureFreshToken()

  let res = await send(method, path, body, isForm)

  // 토큰이 만료 · 무효 → 한 번만 새로 받아 다시 시도. 그래도 안 되면 로그아웃 (RequireAuth 가 로그인 화면으로)
  if (res.status === 401 && !isAuthCall && useAuthStore.getState().member) {
    if (await refreshAccessToken()) res = await send(method, path, body, isForm)
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ErrorBody | null
    throw new ApiError(
      res.status,
      data?.code ?? 'UNKNOWN',
      data?.message ?? `요청에 실패했습니다. (${res.status})`,
      data?.fieldErrors ?? [],
    )
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form, true),
}

/** 쿼리스트링 — 빈 값은 뺀다 */
export const qs = (params: Record<string, string | number | null | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : ''
}
