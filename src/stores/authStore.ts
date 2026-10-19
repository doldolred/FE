import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse, MemberSummary } from '../api/types'

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
    {
      name: 'doldol-auth',
      // 새로고침했을 때 이미 만료된 토큰이면 버림
      onRehydrateStorage: () => (state) => {
        if (state?.expiresAt && state.expiresAt < Date.now()) state.logout()
      },
    },
  ),
)

export const useIsLoggedIn = () => useAuthStore((s) => s.accessToken !== null)
