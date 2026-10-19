import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useIsLoggedIn } from '../stores/authStore'

/** 로그인 필요한 라우트를 감싸는 가드. 비로그인이면 /login?redirect=현재경로 */
export default function RequireAuth() {
  const loggedIn = useIsLoggedIn()
  const location = useLocation()

  if (!loggedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return <Outlet />
}
