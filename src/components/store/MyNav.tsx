import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/mypage', label: '홈', end: true },
  { to: '/mypage/orders', label: '주문 내역' },
  { to: '/mypage/claims', label: '취소 · 반품 · 교환' },
  { to: '/wishlist', label: '위시리스트' },
  { to: '/mypage/reviews', label: '후기' },
  { to: '/mypage/inquiries', label: '1:1 문의' },
  { to: '/mypage/profile', label: '내 정보' },
]

/** 마이페이지 탭 — 마이페이지 아래 화면들 맨 위에 같이 둔다 */
export default function MyNav() {
  return (
    <nav className="dd-tabs" aria-label="마이페이지 메뉴">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
