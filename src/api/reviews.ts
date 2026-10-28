import { api, qs } from './client'
import type { CreateReviewRequest, Page, Review, ReviewSort, ReviewSummary, WritableItem } from './types'

// 상품 상세 (로그인 없이) — 숨긴 후기는 서버가 뺀다
export const fetchProductReviews = (productId: number, sort: ReviewSort, photoOnly: boolean, page: number) =>
  api.get<Page<Review>>(`/api/products/${productId}/reviews${qs({ sort, photoOnly: photoOnly ? 'true' : undefined, page, size: 10 })}`)
export const fetchReviewSummary = (productId: number) => api.get<ReviewSummary>(`/api/products/${productId}/reviews/summary`)

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
