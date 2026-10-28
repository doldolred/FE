import { useQuery } from '@tanstack/react-query'
import { useState, type CSSProperties } from 'react'
import { fetchProductReviews, fetchReviewSummary } from '../../api/reviews'
import { queryKeys } from '../../api/queryKeys'
import type { Review, ReviewSort } from '../../api/types'
import { formatDay } from '../../lib/format'
import { Stars } from './Stars'

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: 'best', label: '베스트순' },
  { value: 'latest', label: '최신순' },
  { value: 'rating_high', label: '별점 높은순' },
  { value: 'rating_low', label: '별점 낮은순' },
]

/** 상품 상세 아래 후기 — 평점 요약 · 정렬 · 사진 후기만 · 더 보기 (v4 상세 바탕 위) */
export default function ProductReviews({ productId }: { productId: number }) {
  const [sort, setSort] = useState<ReviewSort>('best')
  const [photoOnly, setPhotoOnly] = useState(false)
  const [page, setPage] = useState(0)
  const summary = useQuery({ queryKey: queryKeys.reviewSummary(productId), queryFn: () => fetchReviewSummary(productId) })
  const list = useQuery({
    queryKey: queryKeys.reviews(productId, sort, photoOnly, page),
    queryFn: () => fetchProductReviews(productId, sort, photoOnly, page),
  })
  const s = summary.data

  return (
    <section className="dd-reviews" id="reviews" aria-label="후기">
      <div className="inner">
        <h2>
          REVIEWS <em>{s ? s.total.toLocaleString() : ''}</em>
        </h2>

        {s && s.total > 0 && (
          <div className="summary">
            <div className="avg">
              <b>{s.average.toFixed(1)}</b>
              <Stars value={s.average} size={22} />
              <span>{s.total.toLocaleString()}개 후기</span>
            </div>
            <ol className="bars" aria-label="별점 분포">
              {s.counts.map((c, i) => (
                <li key={i}>
                  <span>{5 - i}점</span>
                  <i style={{ '--w': `${s.total ? (c / s.total) * 100 : 0}%` } as CSSProperties} />
                  <span className="tabular-nums">{c}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="controls">
          <div className="sorts" role="tablist" aria-label="정렬">
            {SORTS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="tab"
                aria-selected={sort === o.value}
                onClick={() => {
                  setSort(o.value)
                  setPage(0)
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
          <label className="photo">
            <input
              type="checkbox"
              checked={photoOnly}
              onChange={(e) => {
                setPhotoOnly(e.target.checked)
                setPage(0)
              }}
            />
            사진 후기만
          </label>
        </div>

        {list.isPending ? (
          <p className="empty">불러오는 중…</p>
        ) : list.error ? (
          <p className="empty">후기를 불러오지 못했어요.</p>
        ) : list.data.content.length === 0 ? (
          <p className="empty">{photoOnly ? '사진 후기가 아직 없어요.' : '아직 후기가 없어요. 첫 후기를 남겨 주세요.'}</p>
        ) : (
          <ul className="list">
            {list.data.content.map((r) => (
              <li key={r.id}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        )}

        {list.data && list.data.totalPages > 1 && (
          <div className="pager">
            <button type="button" disabled={page <= 0} onClick={() => setPage(page - 1)}>
              ← 이전
            </button>
            <span className="tabular-nums">
              {page + 1} / {list.data.totalPages}
            </span>
            <button type="button" disabled={page + 1 >= list.data.totalPages} onClick={() => setPage(page + 1)}>
              다음 →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export function ReviewCard({ review: r, showProduct = false }: { review: Review; showProduct?: boolean }) {
  return (
    <article className="dd-review">
      <div className="head">
        <Stars value={r.rating} size={16} />
        {r.best && <span className="best">BEST</span>}
        <span className="meta">
          {r.author} · {r.optionName} · {formatDay(r.createdAt)}
        </span>
      </div>
      {showProduct && <p className="product">{r.productName}</p>}
      <p className="content">{r.content}</p>
      {r.imageUrls.length > 0 && (
        <div className="photos">
          {r.imageUrls.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer">
              <img src={u} alt="후기 사진" loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {r.reply && (
        <div className="reply">
          <b>
            돌돌 <em>답글</em>
          </b>
          <p>{r.reply}</p>
        </div>
      )}
    </article>
  )
}
