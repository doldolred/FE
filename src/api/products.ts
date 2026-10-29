import { api } from './client'
import type { Product } from './types'

/**
 * 라인업 항목(V13)이 없는 예전 서버 응답도 깨지지 않게 기본값을 채운다
 * (FE 가 먼저 배포되고 BE 가 늦게 올라가는 사이에도 메인 · 상세가 보이도록).
 */
const normalize = (p: Product): Product => {
  // 예전 서버면 라인업 항목이 아예 없다 — 레드비트즙(1)은 V13 에 넣은 값 그대로 채운다
  const legacy = p.status === undefined
  const beet = legacy && p.id === 1
  return {
    ...p,
    status: p.status ?? 'SELLING',
    enName: p.enName ?? (beet ? 'RED BEET' : null),
    spec: p.spec ?? (beet ? '120ml × 30포 / 60포' : null),
    points: p.points ?? (beet ? ['비트 100%', '물 0% · 설탕 0%', '120ml 한 포'] : []),
    theme: p.theme ?? 'NAVY',
    art: p.art ?? 'POUCH',
    artFrontUrl: p.artFrontUrl ?? (beet ? '/products/beet/pouch-art-front.webp' : null),
    artBackUrl: p.artBackUrl ?? (beet ? '/products/beet/pouch-art-back.webp' : null),
  }
}

export const fetchProducts = () => api.get<Product[]>('/api/products').then((list) => list.map(normalize))

export const fetchProduct = (id: number) => api.get<Product>(`/api/products/${id}`).then(normalize)
