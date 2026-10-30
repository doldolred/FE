import { Outlet, useMatch } from 'react-router-dom'
import CookieNotice from './CookieNotice'
import Footer from './Footer'
import Header from './Header'

export default function Layout() {
  // 메인 · 상품 상세(출시 예정 포함)는 풀블리드 (프로토타입 v4) — 본문 폭 제한 없이 화면 전체에 제 바탕색을 깐다
  const isHome = useMatch('/') !== null
  const isProduct = useMatch('/products/:id') !== null
  const fullBleed = isHome || isProduct

  return (
    <div className="flex min-h-screen flex-col">
      {/* 키보드 · 화면낭독기: Tab 첫 번째로 본문 바로가기 */}
      <a href="#main" className="dd-skip">
        본문 바로가기
      </a>
      <Header overHero={isHome} />
      {fullBleed ? (
        <main id="main" className="flex-1">
          <Outlet />
        </main>
      ) : (
        // 나머지 손님 화면 — v4 크림 바탕 (styles/store.css .dd-sub)
        <main id="main" className="dd-sub flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
            <Outlet />
          </div>
        </main>
      )}
      <Footer dark />
      <CookieNotice />
    </div>
  )
}
