import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import { ProductFigure } from '../components/lineup/Stage'
import MyNav from '../components/store/MyNav'
import PageHead from '../components/store/PageHead'
import WishButton from '../components/store/WishButton'
import { buttonClass } from '../components/ui/buttonStyles'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { artKind, statusLine, themeColors } from '../data/lineup'
import { useIsLoggedIn } from '../stores/authStore'
import { useWishStore } from '../stores/wishStore'

/**
 * /wishlist — 찜한 제품 (이 브라우저에 저장, stores/wishStore). 로그인 없이도 볼 수 있다.
 * 비공개가 된 제품은 목록에서 저절로 빠지고, 찜 목록 아래에는 아직 안 찜한 제품을 권한다.
 */
export default function WishlistPage() {
  const ids = useWishStore((s) => s.ids)
  const loggedIn = useIsLoggedIn()
  const { data: products, isPending, error } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })

  const wished = ids.map((id) => products?.find((p) => p.id === id)).filter((p) => p !== undefined)
  const others = (products ?? []).filter((p) => !ids.includes(p.id))

  return (
    <div>
      {loggedIn && <MyNav />}
      <PageHead kicker="WISHLIST" title="위시리스트" sub="하트를 누른 제품이 여기 모여요. 이 기기에 저장돼요." />
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <>
          {wished.length === 0 ? (
            <div className="ui-empty px-6 py-14 text-center">
              <p className="dd-display-ko text-2xl">아직 찜한 제품이 없어요</p>
              <p className="mt-2 text-sm opacity-70">제품 상세에서 하트를 눌러 보세요.</p>
              <Link to={{ pathname: '/', hash: '#lineup' }} className={buttonClass('primary', 'mt-6')}>
                제품 보러 가기
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {wished.map((p) => {
                const c = themeColors(p.theme)
                return (
                  <article
                    key={p.id}
                    className="dd-card relative"
                    style={{ '--c-bg': c.bg, '--c-fg': c.dark ? '#fff' : '#222021', '--c-stage': c.stage, borderColor: '#222021', boxShadow: '6px 6px 0 #222021' } as CSSProperties}
                  >
                    <Link to={`/products/${p.id}`} className="block">
                      <div className="pic" data-art={artKind(p.art)}>
                        <ProductFigure product={p} />
                      </div>
                      <div className="meta">
                        <b>{p.name}</b>
                        <span>{statusLine(p)}</span>
                      </div>
                    </Link>
                    <div className="absolute top-3 right-3">
                      <WishButton productId={p.id} name={p.name} size="sm" />
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {others.length > 0 && (
            <section className="mt-14">
              <h2 className="dd-display-ko text-2xl">이런 제품도 있어요</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((p) => (
                  <li key={p.id} className="dd-box flex items-center justify-between gap-3 py-3!">
                    <Link to={`/products/${p.id}`} className="min-w-0 hover:underline">
                      <b className="block truncate font-black">{p.name}</b>
                      <span className="text-xs font-bold opacity-70">{statusLine(p)}</span>
                    </Link>
                    <WishButton productId={p.id} name={p.name} size="sm" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
