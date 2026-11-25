import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys'
import { fetchHomeReviews } from '../../api/reviews'
import type { Product } from '../../api/types'
import { shortName } from '../../data/lineup'
import { formatDay } from '../../lib/format'
import { Stars } from './Stars'

/**
 * 메인의 자사몰 후기 구간 (1차 수정 요청) — 구매 띠 아래, 흰 바탕.
 * 판매중인 상품의 후기를 합친 평점 + 베스트 · 최신 후기 카드. 카드를 누르면 그 상품 상세의 후기로 간다.
 * 후기가 하나도 없거나 서버에 닿지 못하면 구간째 그리지 않는다 (빈 틀 · 지어낸 글을 보이지 않게).
 */
export default function HomeReviews({ products }: { products: Product[] | undefined }) {
  const ids = (products ?? []).filter((p) => p.status === 'SELLING').map((p) => p.id)
  const { data } = useQuery({
    queryKey: queryKeys.homeReviews(ids),
    queryFn: () => fetchHomeReviews(ids),
    enabled: ids.length > 0,
    retry: false,
    staleTime: 5 * 60_000,
  })
  const shown = !!data && data.summary.total > 0 && data.reviews.length > 0
  const ref = useRef<HTMLElement>(null)

  // 화면에 들어오면 카드가 차례로 올라온다
  useEffect(() => {
    const el = ref.current
    if (!shown || !el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in')
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])

  if (!shown) return null
  const { summary, reviews } = data
  const first = reviews[0]

  return (
    <section className="dd-hr" id="reviews" data-tone="light" ref={ref} aria-label="후기">
      <div className="inner">
        <header className="head">
          <div>
            <p className="eyebrow dd-kicker">REVIEWS · 자사몰 후기</p>
            <h2>
              먼저 마셔 본
              <br />
              분들의 이야기
            </h2>
          </div>
          <div className="score">
            <b>{summary.average.toFixed(1)}</b>
            <div>
              <Stars value={summary.average} size={18} />
              <span>후기 {summary.total.toLocaleString()}개</span>
            </div>
          </div>
        </header>

        <ul className="cards">
          {reviews.map((r, i) => (
            <li key={r.id} style={{ '--i': i } as CSSProperties}>
              <Link to={`/products/${r.productId}#reviews`} className="card">
                <div className="top">
                  <Stars value={r.rating} size={14} />
                  {r.best && <span className="best">BEST</span>}
                </div>
                {r.imageUrls[0] && <img className="photo" src={r.imageUrls[0]} alt="" loading="lazy" />}
                <p className="content">{r.content}</p>
                <p className="meta">
                  <b>{r.author}</b>
                  <span>
                    {shortName(r.productName)} · {r.optionName}
                  </span>
                  <time dateTime={r.createdAt}>{formatDay(r.createdAt)}</time>
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="foot">
          <Link to={`/products/${first.productId}#reviews`} className="more">
            후기 전체 보기 →
          </Link>
          {data.sample && <span className="sample">견본 후기 — 서버에 연결되지 않아 개발 화면에서만 보여요</span>}
        </div>
      </div>
    </section>
  )
}
