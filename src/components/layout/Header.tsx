import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { fetchCart } from '../../api/cart'
import { queryKeys } from '../../api/queryKeys'
import { useIsAdmin, useIsLoggedIn } from '../../stores/authStore'
import { useWishStore } from '../../stores/wishStore'
import TopBanner from './TopBanner'

/** 둘러보기 메뉴 — 넓은 화면은 가운데 줄, 휴대폰은 ☰ 메뉴 */
const SITE_LINKS = [
  { to: '/products', en: 'SHOP', ko: '제품' },
  { to: '/about', en: 'ABOUT', ko: '회사 소개' },
  { to: '/contact', en: 'CONTACT', ko: '문의하기' },
]

/** 메뉴 글자 — 밑줄이 왼쪽에서 흘러 들어온다 (styles/juice.css .dd-navlink). 지금 화면은 NavLink 의 aria-current 로 밑줄 고정 */
const nav = 'dd-navlink whitespace-nowrap'
/** 오른쪽 아이콘 버튼 (위시 · 내 정보 · 장바구니 · 메뉴) — 가는 선 아이콘, 개수는 작은 빨강 점 */
const iconBtn = 'relative h-10 w-10 place-items-center rounded-full transition-opacity hover:opacity-60'
const badge =
  'absolute right-0 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#da1f2e] px-1 text-[10px] font-bold leading-none tracking-normal text-white'

const ICONS = {
  heart: <path d="M10 16.6s-6.3-3.7-6.3-8.3a3.5 3.5 0 0 1 6.3-2.1 3.5 3.5 0 0 1 6.3 2.1c0 4.6-6.3 8.3-6.3 8.3Z" />,
  user: (
    <>
      <circle cx="10" cy="7" r="3.2" />
      <path d="M3.8 16.8c.6-3.1 3.1-4.9 6.2-4.9s5.6 1.8 6.2 4.9" />
    </>
  ),
  bag: (
    <>
      <path d="M4.6 6.9h10.8l.8 9.9H3.8l.8-9.9Z" />
      <path d="M7.3 6.9V5.7a2.7 2.7 0 0 1 5.4 0v1.2" />
    </>
  ),
  menu: <path d="M3 7h14M3 13h9" />,
}

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

/**
 * 헤더 — 왼쪽 로고 · 가운데 메뉴 · 오른쪽 아이콘(위시 · 내 정보 · 장바구니). 1차 수정 요청의 참고 이미지 배치. 맨 위에 띠배너(관리자 > 띠배너)가 붙는다.
 * 로그아웃 · 회원가입은 마이페이지 · 로그인 화면(휴대폰은 ☰ 메뉴)에 있다.
 * 로고는 어디서나 한 색 (바탕이 밝으면 먹색, 어두우면 흰색 — 빨강 포인트 없음).
 * overHero(메인): 장면 위에 떠 있고, 글자색은 뒤 장면에 따라 먹색/흰색 (--dd-hero-fg — pages/HomePage 가 스크롤마다 정한다).
 *   로고는 제품이 뒤로 지나갈 때 흰색 (--dd-hero-logo). 색 섞기(mix-blend-difference)는 빨강 위에서 민트색이 나와 쓰지 않는다.
 *   띠배너는 따로 맨 위에 고정하고, 메뉴 줄은 그 아래(--dd-banner)에 둔다.
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
    <div className="grid h-[60px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 text-[12px] font-normal tracking-[0.14em] sm:px-[clamp(16px,3vw,40px)]">
      <Link
        to="/"
        className="dd-logo transition-colors duration-300"
        style={overHero ? { color: 'var(--dd-hero-logo, inherit)' } : undefined}
        aria-label="돌돌 홈"
      >
        DOLDOL
      </Link>
      <nav className="hidden justify-center gap-[clamp(22px,3.6vw,56px)] md:flex" aria-label="둘러보기">
        {SITE_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} className={nav}>
            {l.en}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" className={nav}>
            ADMIN
          </NavLink>
        )}
      </nav>
      <nav className="col-start-3 flex items-center justify-end sm:gap-1" aria-label="내 메뉴">
        <NavLink to="/wishlist" className={`hidden sm:grid ${iconBtn}`} aria-label={`위시리스트${wishCount > 0 ? ` ${wishCount}개` : ''}`}>
          <Icon name="heart" />
          {wishCount > 0 && <span className={badge}>{wishCount}</span>}
        </NavLink>
        <NavLink to={loggedIn ? '/mypage' : '/login'} className={`grid ${iconBtn}`} aria-label={loggedIn ? '마이페이지' : '로그인'}>
          <Icon name="user" />
        </NavLink>
        <NavLink to="/cart" className={`grid ${iconBtn}`} aria-label={`장바구니${cartCount > 0 ? ` ${cartCount}개` : ''}`}>
          <Icon name="bag" />
          {cartCount > 0 && <span className={badge}>{cartCount}</span>}
        </NavLink>
        <button
          type="button"
          className={`grid md:hidden ${iconBtn}`}
          onClick={() => setMenuAt(pathname)}
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
        >
          <Icon name="menu" />
        </button>
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
        <header className="fixed inset-x-0 z-[60] text-[var(--dd-hero-fg,#222021)] transition-colors duration-300" style={{ top: 'var(--dd-banner, 0px)' }}>
          {bar}
        </header>
      </>
    )
  }
  return (
    <>
      {menu}
      <header className="sticky top-0 z-20 border-b border-[var(--dd-page-line,rgba(34,32,33,0.14))] bg-[var(--dd-page-bg,#fff)] text-[var(--dd-page-fg,#222021)] transition-colors duration-300">
        <TopBanner />
        {bar}
      </header>
    </>
  )
}

/** 휴대폰 전체 화면 메뉴 */
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
          DOLDOL
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
            <span className="text-sm font-bold text-white/60">{l.ko}</span>
          </Link>
        ))}
        <Link onClick={onClose} to="/faq" className="flex items-baseline justify-between border-b border-white/15 py-3">
          <span className="dd-display text-5xl">FAQ</span>
          <span className="text-sm font-bold text-white/60">자주 묻는 질문</span>
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
