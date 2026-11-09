import { api } from './client'
import type { LoginResponse, OAuthCallbackResponse, OAuthProviderInfo, SocialSignupRequest } from './types'

/** 로그인 화면의 소셜 버튼 — 서버에 키를 넣은 것만 온다 */
export const fetchOAuthProviders = () => api.get<OAuthProviderInfo[]>('/api/auth/oauth/providers')

/** 소셜에서 돌아온 인가 코드 — LOGIN 이면 리프레시 쿠키도 온다, SIGNUP 이면 약관 동의 화면으로 */
export const oauthCallback = (provider: string, code: string, state: string | null) =>
  api.post<OAuthCallbackResponse>(`/api/auth/oauth/${provider}`, { code, state })

/** 처음 온 소셜 계정 — 약관 동의 후 가입 + 로그인 */
export const socialSignup = (req: SocialSignupRequest) => api.post<LoginResponse>('/api/auth/oauth/signup', req)
