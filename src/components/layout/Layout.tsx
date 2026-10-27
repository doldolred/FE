import { Outlet, useMatch } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

export default function Layout() {
  // 메인 · 상품 상세 · 출시 예정은 풀블리드 (프로토타입 v4) — 본문 폭 제한 없이 화면 전체에 제 바탕색을 깐다
  const isHome = useMatch('/') !== null
  const isProduct = useMatch('/products/:id') !== null
  const isLineup = useMatch('/lineup/:slug') !== null
  const fullBleed = isHome || isProduct || isLineup

  return (
    <div className="flex min-h-screen flex-col">
      <Header overHero={isHome} />
      {fullBleed ? (
        <main id="main" className="flex-1">
          <Outlet />
        </main>
      ) : (
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <Outlet />
        </main>
      )}
      <Footer dark={fullBleed} />
    </div>
  )
}
