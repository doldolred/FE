import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse, MemberSummary } from '../api/types'

/**
 * 로그인 상태. 액세스 토큰(30분)은 여기 두고, 로그인 유지용 리프레시 토큰은 HttpOnly 쿠키라 자바스크립트가 모른다.
 * 액세스 토큰이 만료돼도 member 가 있으면 "로그인 중"으로 보고, 다음 요청 때 api/client 가 쿠키로 새 토큰을 받는다.
 */
interface AuthState {
  accessToken: string | null
  expiresAt: number | null
  member: MemberSummary | null
  setLogin: (res: LoginResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      expiresAt: null,
      member: null,
      setLogin: (res) =>
        set({
          accessToken: res.accessToken,
          expiresAt: Date.now() + res.expiresIn * 1000,
          member: res.member,
        }),
      logout: () => set({ accessToken: null, expiresAt: null, member: null }),
    }),
    { name: 'doldol-auth' },
  ),
)

export const useIsLoggedIn = () => useAuthStore((s) => s.member !== null)

export const useIsAdmin = () => useAuthStore((s) => s.member?.role === 'ADMIN')
