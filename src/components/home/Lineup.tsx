import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../api/types'
import { productImageSrc, SHOWCASE } from '../../data/showcase'
import { formatPrice } from '../../lib/format'
import ProductImage from '../product/ProductImage'
import ProductShowcase from '../product/ProductShowcase'
import { buttonClass } from '../ui/buttonStyles'
import Scene from './Scene'

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties

/**
 * 04 라인업 — 상품을 좌우로 넘기며 고른다. 가운데 상품은 360° 무대(ProductShowcase), 아래에 이름 · 가격 · 구매 버튼.
 * 상품이 하나면 화살표 · 점을 숨긴다. 농축액 · 파우더가 생기면 data/showcase.ts 에 한 항목씩 더하면 된다.
 */
export default function Lineup({ products }: { products: Product[] }) {
  const [active, setActive] = useState(0)
  const product = products[Math.min(active, products.length - 1)]
  const showcase = product ? SHOWCASE[product.id] : undefined
  const many = products.length > 1
  const go = (dir: 1 | -1) => setActive((i) => (i + dir + products.length) % products.length)

  return (
    <Scene id="shop" label="라인업" bare className="chapter">
      <div className="mx-auto w-full max-w-6xl px-5 py-28 md:px-10 md:py-44">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
          <div>
            <p data-reveal className="text-xs font-semibold tracking-[0.3em] text-beet-300">
              <span className="text-lg tabular-nums">04</span>
              <span className="mx-3 inline-block h-px w-8 -translate-y-1 bg-current opacity-60" aria-hidden="true" />
              LINEUP
            </p>
            <h2 data-reveal style={delay(120)} className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight break-keep text-cream md:text-6xl">
              오늘부터
              <br />한 포씩
            </h2>
          </div>
          {many && (
            <div data-reveal style={delay(240)} className="flex items-center gap-3">
              <Arrow dir={-1} onClick={() => go(-1)} />
              <span className="text-sm tabular-nums text-cream/50">
                {String(active + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
              </span>
              <Arrow dir={1} onClick={() => go(1)} />
            </div>
          )}
        </header>

        {!product ? (
          <p className="text-cream/50">준비 중인 상품이 없어요.</p>
        ) : (
          <div data-reveal style={delay(300)} className="grid gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-center md:gap-14">
            {showcase ? (
              <ProductShowcase key={`stage-${product.id}`} name={product.name} showcase={showcase} />
            ) : (
              <div className="overflow-hidden rounded-3xl">
                <ProductImage src={productImageSrc(product.id, product.imageUrl)} alt={product.name} />
              </div>
            )}

            <div key={`text-${product.id}`} className="film-caption">
              {showcase && <p className="text-xs font-semibold tracking-[0.3em] text-beet-300">{showcase.wordmark}</p>}
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight break-keep text-cream md:text-5xl">{product.name}</h3>
              {showcase && <p className="mt-4 text-cream/70 md:text-lg">{showcase.tagline}</p>}
              <p className="mt-6 text-2xl font-bold text-cream">{product.soldOut ? '품절' : `${formatPrice(product.minPrice)}~`}</p>
              {/* 옵션(10포 · 30포 · 60포)도 각각 고를 수 있게 — 누르면 그 옵션이 골라진 채로 상세로 */}
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="옵션">
                {product.options.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={`/products/${product.id}?option=${o.id}`}
                      className={`inline-flex items-baseline gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                        o.soldOut ? 'border-cream/10 text-cream/30' : 'border-cream/25 text-cream/80 hover:border-beet-300 hover:text-cream'
                      }`}
                    >
                      <span className="font-semibold">{o.name}</span>
                      <span className="text-xs">{o.soldOut ? '일시품절' : formatPrice(o.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to={`/products/${product.id}`} className={buttonClass('primary', 'rounded-full bg-beet-500 hover:bg-beet-600')}>
                  자세히 보기
                </Link>
              </div>
              {many && (
                <ol className="mt-10 flex gap-2" aria-label="상품 고르기">
                  {products.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-label={p.name}
                        aria-current={i === active ? 'true' : undefined}
                        onClick={() => setActive(i)}
                        className={`scene-dot block h-1 rounded-full ${i === active ? 'w-8 bg-beet-300' : 'w-3 bg-cream/30 hover:bg-cream/60'}`}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </Scene>
  )
}

function Arrow({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 1 ? '다음 상품' : '이전 상품'}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream/70 transition-colors hover:border-beet-300 hover:text-beet-300"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: dir === -1 ? 'scaleX(-1)' : undefined }}>
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
