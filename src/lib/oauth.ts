import type { SocialProvider } from '../api/types'

export const SOCIAL_LABEL: Record<SocialProvider, string> = { KAKAO: '카카오', NAVER: '네이버' }

const KEY = 'doldol-oauth'

/**
 * 소셜 로그인 출발 — 위조 방지용 state 와 돌아갈 주소를 이 탭(sessionStorage)에 적어 두고 소셜 화면으로 간다.
 * 돌아오면(/oauth/:provider/callback) 같은 state 인지 확인한다
 */
export function startSocialLogin(authorizeUrl: string, redirect: string) {
  const state = crypto.randomUUID()
  sessionStorage.setItem(KEY, JSON.stringify({ state, redirect }))
  window.location.href = `${authorizeUrl}&state=${encodeURIComponent(state)}`
}

/** 돌아왔을 때 — 적어 둔 state 가 맞으면 돌아갈 주소, 아니면 null. 한 번 꺼내면 지운다 */
export function takeSocialLogin(state: string | null): { redirect: string } | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { state: string; redirect: string } | null
    sessionStorage.removeItem(KEY)
    return saved && state && saved.state === state ? { redirect: saved.redirect } : null
  } catch {
    return null
  }
}
