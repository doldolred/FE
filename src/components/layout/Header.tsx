import { useQuery } from '@tanstack/react-query'
import { Link, NavLink } from 'react-router-dom'
import { fetchCart } from '../../api/cart'
import { queryKeys } from '../../api/queryKeys'
import { useIsAdmin, useIsLoggedIn } from '../../stores/authStore'
import { useWishStore } from '../../stores/wishStore'
import TopBanner from './TopBanner'

const nav = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap transition-opacity hover:opacity-60 ${isActive ? 'underline underline-offset-4' : ''}`

/**
 * 프로토타입 v4 헤더 — 양쪽 메뉴 · 가운데 로고. 맨 위에 띠배너(관리자 > 띠배너)가 붙는다.
 * overHero(메인): v4 원본처럼 장면 위에 떠서 글자가 바탕과 반대색(mix-blend-difference), 로고 끝 DOL 은 라임.
 *   띠배너는 섞이면 색이 뒤집히니 따로 맨 위에 고정하고, 메뉴 줄은 그 아래(--dd-banner)에 둔다.
 * 그 밖(상세 등): 위에 붙는 띠. 상품 상세는 제품 바탕색(--dd-page-bg · --dd-page-fg)을 따른다.
 */
export default function Header({ overHero = false }: { overHero?: boolean }) {
  const loggedIn = useIsLoggedIn()
  const isAdmin = useIsAdmin()
  const wishCount = useWishStore((s) => s.ids.length)

  const { data: cart } = useQuery({ queryKey: queryKeys.cart, queryFn: fetchCart, enabled: loggedIn })
  const cartCount = cart?.items.length ?? 0

  const bar = (
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
          DOL<em className={overHero ? 'text-[#f6d4cf]' : 'text-[#da1f2e]'}>DOL</em>
        </Link>
        <nav className="flex items-center justify-end gap-3 sm:gap-[clamp(14px,2.4vw,32px)]" aria-label="내 메뉴">
          <NavLink to="/wishlist" className={(s) => `hidden sm:inline ${nav(s)}`}>
            위시{wishCount > 0 && ` ${wishCount}`}
          </NavLink>
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
              <NavLink to="/logout" className={(s) => `hidden sm:inline ${nav(s)}`}>
                로그아웃
              </NavLink>
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
  )

  if (overHero) {
    return (
      <>
        <div className="fixed inset-x-0 top-0 z-[61]">
          <TopBanner />
        </div>
        <header className="fixed inset-x-0 z-[60] text-white mix-blend-difference" style={{ top: 'var(--dd-banner, 0px)' }}>
          {bar}
        </header>
      </>
    )
  }
  return (
    <header className="sticky top-0 z-20 border-b-2 border-[var(--dd-page-line,#222021)] bg-[var(--dd-page-bg,#fff)] text-[var(--dd-page-fg,#222021)] transition-colors duration-300">
      <TopBanner />
      {bar}
    </header>
  )
}
