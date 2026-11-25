import { api, qs } from './client'
import { unreachable } from './products'
import type { CreateReviewRequest, Page, Review, ReviewSort, ReviewSummary, WritableItem } from './types'

// 상품 상세 (로그인 없이) — 숨긴 후기는 서버가 뺀다
export const fetchProductReviews = (productId: number, sort: ReviewSort, photoOnly: boolean, page: number) =>
  api.get<Page<Review>>(`/api/products/${productId}/reviews${qs({ sort, photoOnly: photoOnly ? 'true' : undefined, page, size: 10 })}`)
export const fetchReviewSummary = (productId: number) => api.get<ReviewSummary>(`/api/products/${productId}/reviews/summary`)

/** 메인에 보여 줄 후기 수 */
const HOME_REVIEW_COUNT = 6

export interface HomeReviews {
  /** 판매중인 상품 전체를 합친 평점 */
  summary: ReviewSummary
  /** 베스트 먼저, 그다음 최신순 */
  reviews: Review[]
  /** 서버에 닿지 못해 견본을 보여 주는 중 (개발 화면에서만) */
  sample?: boolean
}

/**
 * 메인의 후기 구간 — 상품마다 있는 후기 API(요약 · 베스트순 목록)를 불러 하나로 합친다.
 * 관리자가 BEST 로 고른 후기가 맨 앞에 온다. 숨긴 후기는 서버가 뺀다.
 * 서버에 닿지 못하면 오류 그대로 (화면은 구간을 숨긴다) — 지어낸 후기를 손님에게 보이지 않게, 견본은 개발 화면에서만 쓴다.
 */
export async function fetchHomeReviews(productIds: number[]): Promise<HomeReviews> {
  try {
    const parts = await Promise.all(
      productIds.map(async (id) => {
        const [summary, list] = await Promise.all([
          fetchReviewSummary(id),
          api.get<Page<Review>>(`/api/products/${id}/reviews${qs({ sort: 'best', page: 0, size: HOME_REVIEW_COUNT })}`),
        ])
        return { summary, reviews: list.content }
      }),
    )
    const counts = [0, 0, 0, 0, 0]
    for (const p of parts) p.summary.counts.forEach((c, i) => (counts[i] += c))
    const total = counts.reduce((a, b) => a + b, 0)
    const sum = counts.reduce((a, c, i) => a + c * (5 - i), 0)
    const reviews = parts
      .flatMap((p) => p.reviews)
      .sort((a, b) => Number(b.best) - Number(a.best) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, HOME_REVIEW_COUNT)
    return { summary: { total, average: total ? Math.round((sum * 10) / total) / 10 : 0, counts }, reviews }
  } catch (e) {
    if (import.meta.env.DEV && unreachable(e)) return (await import('../data/sampleReviews')).SAMPLE_HOME_REVIEWS
    throw e
  }
}

// 회원
export const uploadReviewImage = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.upload<{ url: string }>('/api/reviews/images', form)
}
export const fetchWritableItems = () => api.get<WritableItem[]>('/api/reviews/writable')
export const createReview = (req: CreateReviewRequest) => api.post<Review>('/api/reviews', req)
export const fetchMyReviews = (page: number) => api.get<Page<Review>>(`/api/reviews/mine${qs({ page, size: 20 })}`)
export const deleteReview = (id: number) => api.delete<void>(`/api/reviews/${id}`)
