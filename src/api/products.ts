import { api } from './client'
import type { Product } from './types'

/**
 * 라인업 항목(V13)이 없는 예전 서버 응답도 깨지지 않게 기본값을 채운다
 * (FE 가 먼저 배포되고 BE 가 늦게 올라가는 사이에도 메인 · 상세가 보이도록).
 */
const normalize = (p: Product): Product => ({
  ...p,
  status: p.status ?? 'SELLING',
  enName: p.enName ?? null,
  spec: p.spec ?? null,
  points: p.points ?? [],
  theme: p.theme ?? 'NAVY',
  art: p.art ?? 'POUCH',
  artFrontUrl: p.artFrontUrl ?? null,
  artBackUrl: p.artBackUrl ?? null,
})

export const fetchProducts = () => api.get<Product[]>('/api/products').then((list) => list.map(normalize))

export const fetchProduct = (id: number) => api.get<Product>(`/api/products/${id}`).then(normalize)
