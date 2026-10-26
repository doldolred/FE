import { Outlet, useMatch } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

export default function Layout() {
  // 메인은 풀블리드 (프로토타입 v4) — 헤더가 장면 위에 뜨고, 본문 폭 제한이 없다
  const isHome = useMatch('/') !== null

  return (
    <div className="flex min-h-screen flex-col">
      <Header overHero={isHome} />
      {isHome ? (
        <main id="main" className="flex-1">
          <Outlet />
        </main>
      ) : (
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <Outlet />
        </main>
      )}
      <Footer dark={isHome} />
    </div>
  )
}
