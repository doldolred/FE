import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logoutRequest } from '../../api/auth'
import { fetchCart } from '../../api/cart'
import { queryKeys } from '../../api/queryKeys'
import { useAuthStore, useIsAdmin, useIsLoggedIn } from '../../stores/authStore'

const nav = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap transition-opacity hover:opacity-60 ${isActive ? 'underline underline-offset-4' : ''}`

/**
 * 프로토타입 v4 헤더 — 양쪽 메뉴 · 가운데 로고.
 * overHero(메인): 장면 위에 투명하게 뜬다. 글자색은 지금 장면 바탕에 맞춰 메인이 정한다(--dd-head · --dd-head-em).
 */
export default function Header({ overHero = false }: { overHero?: boolean }) {
  const loggedIn = useIsLoggedIn()
  const isAdmin = useIsAdmin()
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: cart } = useQuery({ queryKey: queryKeys.cart, queryFn: fetchCart, enabled: loggedIn })
  const cartCount = cart?.items.length ?? 0

  const handleLogout = async () => {
    await logoutRequest().catch(() => undefined) // 리프레시 쿠키 지우기 — 실패해도 화면은 로그아웃
    logout()
    queryClient.clear()
    navigate('/')
  }

  const headerClass = overHero
    ? 'fixed inset-x-0 top-0 z-50 text-[var(--dd-head,#111)] transition-colors duration-300'
    : 'sticky top-0 z-20 border-b-2 border-neutral-900 bg-white text-neutral-900'

  return (
    <header className={headerClass}>
      <div className="grid h-[60px] grid-cols-[1fr_auto_1fr] items-center px-4 text-[11px] font-extrabold tracking-[0.12em] sm:px-[clamp(16px,3vw,40px)]">
        <nav className="hidden gap-[clamp(16px,3vw,44px)] md:flex" aria-label="둘러보기">
          <Link to={{ pathname: '/', hash: '#lineup' }} className="hover:opacity-60">
            LINEUP
          </Link>
          <Link to={{ pathname: '/', hash: '#about' }} className="hover:opacity-60">
            ABOUT
          </Link>
          <Link to={{ pathname: '/', hash: '#buy' }} className="hover:opacity-60">
            SHOP
          </Link>
        </nav>
        <Link to="/" className="dd-logo col-start-2" aria-label="돌돌 홈">
          DOL<em className={`not-italic transition-colors duration-300 ${overHero ? 'text-[var(--dd-head-em,#e4002b)]' : 'text-[#e4002b]'}`}>DOL</em>
        </Link>
        <nav className="flex items-center justify-end gap-3 sm:gap-[clamp(14px,2.4vw,32px)]" aria-label="내 메뉴">
          <NavLink to="/cart" className={nav}>
            장바구니{cartCount > 0 && ` ${cartCount}`}
          </NavLink>
          {loggedIn ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" className={(s) => `hidden sm:inline ${nav(s)}`}>
                  관리자
                </NavLink>
              )}
              <NavLink to="/mypage" className={nav}>
                MY
              </NavLink>
              <button type="button" onClick={handleLogout} className="hidden whitespace-nowrap tracking-[0.12em] hover:opacity-60 sm:inline">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={nav}>
                로그인
              </NavLink>
              <NavLink to="/signup" className={(s) => `hidden sm:inline ${nav(s)}`}>
                회원가입
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
