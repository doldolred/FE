import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logoutRequest } from '../../api/auth'
import { fetchCart } from '../../api/cart'
import { queryKeys } from '../../api/queryKeys'
import { useScrolledPast } from '../../lib/useScroll'
import { useAuthStore, useIsAdmin, useIsLoggedIn } from '../../stores/authStore'

const lightNav = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap text-sm ${isActive ? 'font-semibold text-beet-800' : 'text-neutral-600 hover:text-neutral-900'}`
const darkNav = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap text-sm ${isActive ? 'font-semibold text-beet-300' : 'text-cream/70 hover:text-cream'}`

/** overHero: 메인 히어로 위 — 맨 위에서는 투명, 내려가면 어두운 유리로 굳는다 */
export default function Header({ overHero = false }: { overHero?: boolean }) {
  const loggedIn = useIsLoggedIn()
  const isAdmin = useIsAdmin()
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: cart } = useQuery({ queryKey: queryKeys.cart, queryFn: fetchCart, enabled: loggedIn })
  const cartCount = cart?.items.length ?? 0
  const scrolled = useScrolledPast(0.6)
  const navClass = overHero ? darkNav : lightNav
  const headerClass = overHero
    ? `fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${scrolled ? 'border-b border-cream/10 bg-ink/80 backdrop-blur' : 'bg-transparent'}`
    : 'sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur'

  const handleLogout = async () => {
    await logoutRequest().catch(() => undefined) // 리프레시 쿠키 지우기 — 실패해도 화면은 로그아웃
    logout()
    queryClient.clear()
    navigate('/')
  }

  return (
    <header className={headerClass}>
      <div className={`mx-auto flex h-16 max-w-6xl items-center justify-between ${overHero ? 'px-5 md:px-10' : 'px-4'}`}>
        <Link to="/" className={`shrink-0 whitespace-nowrap text-lg font-extrabold sm:text-xl ${overHero ? 'text-cream' : 'text-beet-800'}`}>
          돌돌 비트즙
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <NavLink to="/cart" className={navClass}>
            장바구니
            {cartCount > 0 && (
              <span className="ml-1 rounded-full bg-beet-700 px-1.5 py-0.5 text-xs text-white">{cartCount}</span>
            )}
          </NavLink>
          {loggedIn ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" className={navClass}>
                  관리자
                </NavLink>
              )}
              <NavLink to="/mypage" className={navClass}>
                마이페이지
              </NavLink>
              <button type="button" onClick={handleLogout} className={`whitespace-nowrap text-sm ${overHero ? 'text-cream/70 hover:text-cream' : 'text-neutral-600 hover:text-neutral-900'}`}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                로그인
              </NavLink>
              <NavLink to="/signup" className={navClass}>
                회원가입
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
