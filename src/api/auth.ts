import { api } from './client'
import type { LoginRequest, LoginResponse, Member, SignupRequest, SignupResponse } from './types'

export const signup = (req: SignupRequest) => api.post<SignupResponse>('/api/auth/signup', req)

/** 응답과 함께 로그인 유지용 리프레시 쿠키(HttpOnly)가 온다 */
export const login = (req: LoginRequest) => api.post<LoginResponse>('/api/auth/login', req)

/** 이 기기의 리프레시 쿠키를 지운다 */
export const logoutRequest = () => api.post<void>('/api/auth/logout')

export const requestPasswordReset = (email: string) => api.post<void>('/api/auth/password/forgot', { email })

export const resetPassword = (token: string, newPassword: string) =>
  api.post<void>('/api/auth/password/reset', { token, newPassword })

export const fetchMe = () => api.get<Member>('/api/members/me')

/** 다른 기기는 로그아웃되고, 지금 기기에는 새 토큰이 온다 */
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.patch<LoginResponse>('/api/members/me/password', { currentPassword, newPassword })

export const changeMarketing = (agreed: boolean) => api.patch<Member>('/api/members/me/marketing', { agreed })

/** 회원 탈퇴 — 개인정보를 지우고 이 기기의 로그인 쿠키도 지운다 (진행 중인 주문이 있으면 409) */
export const withdraw = (password: string) => api.post<void>('/api/members/me/withdraw', { password })
