import { api, qs } from './client'
import type { Claim, CreateClaimRequest, Page } from './types'

// 내 취소 · 반품 · 교환 (로그인 필요)
export const createClaim = (orderNumber: string, req: CreateClaimRequest) => api.post<Claim>(`/api/orders/${orderNumber}/claims`, req)
export const fetchOrderClaims = (orderNumber: string) => api.get<Claim[]>(`/api/orders/${orderNumber}/claims`)
export const fetchMyClaims = (page: number) => api.get<Page<Claim>>(`/api/claims${qs({ page, size: 20 })}`)
/** 접수 상태에서만 */
export const withdrawClaim = (id: number) => api.post<Claim>(`/api/claims/${id}/withdraw`)
export const uploadClaimImage = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.upload<{ url: string }>('/api/claims/images', form)
}
