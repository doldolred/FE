import { api, qs } from './client'
import type { Page, PointHistory, PointSummary } from './types'

/** 내 적립금 잔액 · 곧 사라질 금액 · 정책 (로그인 필요) */
export const fetchPointSummary = () => api.get<PointSummary>('/api/points')

export const fetchPointHistory = (page = 0) => api.get<Page<PointHistory>>(`/api/points/history${qs({ page, size: 20 })}`)
