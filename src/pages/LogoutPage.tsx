import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { logoutRequest } from '../api/auth'
import { buttonClass } from '../components/ui/buttonStyles'
import { useAuthStore } from '../stores/authStore'

/** /logout — 들어오면 로그아웃하고 인사. 헤더의 "로그아웃"이 여기로 온다 */
export default function LogoutPage() {
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    // 리프레시 쿠키 지우기 — 실패해도 화면은 로그아웃
    logoutRequest()
      .catch(() => undefined)
      .finally(() => {
        logout()
        queryClient.clear()
      })
  }, [logout, queryClient])

  return (
    <div className="dd-hero-note">
      <p className="big">See you!</p>
      <h1>로그아웃했어요</h1>
      <p>오늘도 붉은 한 포 챙기셨나요? 또 만나요.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClass('primary')}>
          홈으로
        </Link>
        <Link to="/login" className={buttonClass('secondary')}>
          다시 로그인
        </Link>
      </div>
    </div>
  )
}
