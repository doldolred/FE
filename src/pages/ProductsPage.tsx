import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import type { Product } from '../api/types'
import { ProductFigure } from '../components/lineup/Stage'
import PageHead from '../components/store/PageHead'
import WishButton from '../components/store/WishButton'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { artKind, statusLine, themeColors } from '../data/lineup'

/**
 * /products — 돌돌 전체 제품 (판매중 먼저, 그다음 출시 예정 · 관리자 라인업 순서).
 * 카드는 제품마다 제 색(관리자 > 상품 > 라인업 색)이고, 스티커 문구(points)를 같이 보여 준다.
 */
export default function ProductsPage() {
  const { data: products, isPending, error } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })

  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />

  const selling = products.filter((p) => p.status === 'SELLING')
  const soon = products.filter((p) => p.status === 'COMING_SOON')

  return (
    <div>
      <PageHead kicker="PRODUCTS" title="제품" sub="제주 비트로 만드는 돌돌의 제품이에요. 하트를 누르면 위시리스트에 담겨요." />
      {selling.length > 0 && <Shelf title="지금 살 수 있어요" products={selling} />}
      {soon.length > 0 && <Shelf title="곧 나와요" products={soon} />}
      {products.length === 0 && (
        <div className="ui-empty px-6 py-14 text-center">
          <p className="dd-display-ko text-2xl">준비 중인 제품이에요</p>
          <p className="mt-2 text-sm opacity-70">곧 새 제품으로 찾아올게요.</p>
        </div>
      )}
    </div>
  )
}

function Shelf({ title, products }: { title: string; products: Product[] }) {
  return (
    <section className="mb-14">
      <h2 className="dd-display-ko mb-5 text-2xl">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product: p }: { product: Product }) {
  const c = themeColors(p.theme)
  return (
    <article
      className="dd-card relative flex flex-col"
      style={{ '--c-bg': c.bg, '--c-fg': c.dark ? '#fff' : '#222021', '--c-stage': c.stage, borderColor: '#222021', boxShadow: '6px 6px 0 #222021' } as CSSProperties}
    >
      <Link to={`/products/${p.id}`} className="flex flex-1 flex-col" aria-label={`${p.name} ${p.status === 'COMING_SOON' ? '미리 보기' : '자세히 보기'}`}>
        <div className="pic" data-art={artKind(p.art)}>
          <ProductFigure product={p} />
        </div>
        <div className="meta flex-1">
          {p.enName && <span className="dd-kicker text-[11px]! tracking-[0.14em] opacity-60!">{p.enName}</span>}
          <b>{p.name}</b>
          <span>{statusLine(p)}</span>
          {p.points.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {p.points.map((t) => (
                <li key={t} className="rounded-full border-2 border-current px-2.5 py-0.5 text-[11px] font-black">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
      <div className="absolute top-3 right-3">
        <WishButton productId={p.id} name={p.name} size="sm" />
      </div>
    </article>
  )
}
