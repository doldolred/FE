import { api } from './client'
import type { Banner } from './types'

// 띠배너 (로그인 없이) — 서버가 켜져 있고 기간 안인 것만, 정한 순서대로 준다
export const fetchBanners = () => api.get<Banner[]>('/api/banners')
