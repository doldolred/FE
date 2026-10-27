import { api, qs } from './client'
import type { Notice, Page } from './types'

// 공지사항 (로그인 없이) — 공개된 것만, 고정 먼저 → 최신순
export const fetchNotices = (page: number) => api.get<Page<Notice>>(`/api/notices${qs({ page, size: 20 })}`)
export const fetchNotice = (id: number) => api.get<Notice>(`/api/notices/${id}`)
