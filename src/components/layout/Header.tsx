import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { fetchCart } from '../../api/cart'
import { queryKeys } from '../../api/queryKeys'
import { useIsAdmin, useIsLoggedIn } from '../../stores/authStore'
import { useWishStore } from '../../stores/wishStore'
import TopBanner from './TopBanner'

/** 둘러보기 메뉴 — 넓은 화면은 왼쪽 줄, 휴대폰은 ☰ 메뉴 */
const SITE_LINKS = [
  { to: '/products', en: 'SHOP', ko: '제품' },
  { to: '/about', en: 'ABOUT', ko: '회사 소개' },
  { to: '/contact', en: 'CONTACT', ko: '문의하기' },
]

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
  // 메뉴를 연 화면 주소 — 다른 화면으로 넘어가면 저절로 닫힌다
  const { pathname } = useLocation()
  const [menuAt, setMenuAt] = useState<string | null>(null)
  const menuOpen = menuAt === pathname

  const { data: cart } = useQuery({ queryKey: queryKeys.cart, queryFn: fetchCart, enabled: loggedIn })
  const cartCount = cart?.items.length ?? 0

  const bar = (
      <div className="grid h-[60px] grid-cols-[1fr_auto_1fr] items-center px-4 text-[11px] font-extrabold tracking-[0.12em] sm:px-[clamp(16px,3vw,40px)]">
        <nav className="hidden gap-[clamp(16px,3vw,44px)] md:flex" aria-label="둘러보기">
          {SITE_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={nav}>
              {l.en}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="flex h-10 w-10 flex-col items-start justify-center gap-[5px] md:hidden"
          onClick={() => setMenuAt(pathname)}
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
        >
          <span className="block h-[2px] w-6 bg-current" />
          <span className="block h-[2px] w-4 bg-current" />
        </button>
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

  const menu = menuOpen && <MobileMenu loggedIn={loggedIn} isAdmin={isAdmin} wishCount={wishCount} onClose={() => setMenuAt(null)} />

  if (overHero) {
    return (
      <>
        {menu}
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
    <>
      {menu}
      <header className="sticky top-0 z-20 border-b-2 border-[var(--dd-page-line,#222021)] bg-[var(--dd-page-bg,#fff)] text-[var(--dd-page-fg,#222021)] transition-colors duration-300">
        <TopBanner />
        {bar}
      </header>
    </>
  )
}

/** 휴대폰 전체 화면 메뉴 — 헤더 밖에 두어 메인의 색 뒤집기(mix-blend)를 받지 않는다 */
function MobileMenu({ loggedIn, isAdmin, wishCount, onClose }: { loggedIn: boolean; isAdmin: boolean; wishCount: number; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  const sub = loggedIn
    ? [
        { to: '/mypage', label: '마이페이지' },
        { to: '/mypage/orders', label: '주문 내역' },
        { to: `/wishlist`, label: `위시리스트${wishCount > 0 ? ` ${wishCount}` : ''}` },
        ...(isAdmin ? [{ to: '/admin', label: '관리자' }] : []),
        { to: '/logout', label: '로그아웃' },
      ]
    : [
        { to: '/login', label: '로그인' },
        { to: '/signup', label: '회원가입' },
        { to: `/wishlist`, label: `위시리스트${wishCount > 0 ? ` ${wishCount}` : ''}` },
      ]

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#222021] px-6 pt-5 pb-10 text-white md:hidden" role="dialog" aria-modal="true" aria-label="메뉴">
      <div className="flex items-center justify-between">
        <Link onClick={onClose} to="/" className="dd-logo" aria-label="돌돌 홈">
          DOL<em className="text-[#da1f2e]">DOL</em>
        </Link>
        {/* 열리면 닫기 버튼에 초점 — 키보드로 바로 Esc · Tab 이동 */}
        {/* oxlint-disable-next-line jsx-a11y/no-autofocus */}
        <button type="button" autoFocus onClick={onClose} className="grid h-10 w-10 place-items-center text-2xl" aria-label="메뉴 닫기">
          ✕
        </button>
      </div>
      <nav className="mt-10 flex flex-col gap-2" aria-label="둘러보기">
        {SITE_LINKS.map((l) => (
          <Link onClick={onClose} key={l.to} to={l.to} className="group flex items-baseline justify-between border-b border-white/15 py-3">
            <span className="dd-display text-5xl group-hover:text-[#da1f2e]">{l.en}</span>
            <span className="text-sm font-bold text-[#f6d4cf]">{l.ko}</span>
          </Link>
        ))}
        <Link onClick={onClose} to="/faq" className="flex items-baseline justify-between border-b border-white/15 py-3">
          <span className="dd-display text-5xl">FAQ</span>
          <span className="text-sm font-bold text-[#f6d4cf]">자주 묻는 질문</span>
        </Link>
      </nav>
      <nav className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 pt-10 text-sm font-bold" aria-label="내 메뉴">
        {sub.map((l) => (
          <Link onClick={onClose} key={l.to} to={l.to} className="opacity-80 hover:opacity-100">
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
