import { useAuthStore } from '../stores/authStore'

// 개발: Vite proxy, 운영: nginx/Ingress가 /api 를 백엔드로 넘겨줌
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다.')
  }

  // 토큰 만료/위조 → 로그아웃 (RequireAuth 가 로그인 화면으로 보냄)
  if (res.status === 401 && token) useAuthStore.getState().logout()

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
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
