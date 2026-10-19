import { ApiError } from '../api/client'

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

/** 서버 검증 에러를 { field: message } 로 */
export const getFieldErrors = (error: unknown): Record<string, string> =>
  error instanceof ApiError
    ? Object.fromEntries(error.fieldErrors.map((e) => [e.field, e.message]))
    : {}

/** ?redirect= 값은 내부 경로만 허용 */
export const safeRedirect = (value: string | null, fallback = '/') =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : fallback
