import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { fetchWaitingInquiryCount } from '../../api/admin'
import { useIsAdmin, useIsLoggedIn } from '../../stores/authStore'

const MENU = [
  { to: '/admin', label: '매출', end: true },
  { to: '/admin/orders', label: '주문' },
  { to: '/admin/products', label: '상품' },
  { to: '/admin/members', label: '회원' },
  { to: '/admin/inquiries', label: '문의함' },
  { to: '/admin/shipping', label: '배송 지역' },
  { to: '/admin/banners', label: '띠배너' },
  { to: '/admin/notices', label: '공지사항' },
]

/** /admin/** — 관리자만. 서버도 /api/admin/** 를 ADMIN 만 허용하므로 화면 가드는 편의용 */
export default function AdminLayout() {
  const loggedIn = useIsLoggedIn()
  const isAdmin = useIsAdmin()
  const location = useLocation()
  // 답변 대기 문의 수 — 메뉴에 빨간 숫자로 (1분마다 새로)
  const waiting = useQuery({
    queryKey: ['admin', 'inquiries-waiting'],
    queryFn: fetchWaitingInquiryCount,
    enabled: loggedIn && isAdmin,
    refetchInterval: 60_000,
  })

  if (!loggedIn) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 overflow-x-auto px-4">
          <Link to="/admin" className="shrink-0 font-extrabold text-beet-800">
            돌돌 관리자
          </Link>
          <nav className="flex shrink-0 gap-1">
            {MENU.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                end={m.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-beet-50 font-semibold text-beet-800' : 'text-neutral-600 hover:bg-neutral-100'}`
                }
              >
                {m.label}
                {m.to === '/admin/inquiries' && (waiting.data?.count ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-beet-700 px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums">{waiting.data!.count}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <Link to="/" className="ml-auto shrink-0 text-sm text-neutral-500 hover:underline">
            쇼핑몰로 →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
