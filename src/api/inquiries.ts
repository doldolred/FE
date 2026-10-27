import { api, qs } from './client'
import type { CreateInquiryRequest, Inquiry, Page } from './types'

// 내 1:1 문의 (로그인 필요)
export const fetchInquiries = (page: number) => api.get<Page<Inquiry>>(`/api/inquiries${qs({ page, size: 20 })}`)
export const fetchInquiry = (id: number) => api.get<Inquiry>(`/api/inquiries/${id}`)
export const createInquiry = (req: CreateInquiryRequest) => api.post<Inquiry>('/api/inquiries', req)
/** 답이 달리기 전에만 (달렸으면 409 INQUIRY_ALREADY_ANSWERED) */
export const deleteInquiry = (id: number) => api.delete<void>(`/api/inquiries/${id}`)
