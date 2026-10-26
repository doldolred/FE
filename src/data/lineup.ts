/**
 * 돌돌 라인업 — 메인(프로토타입 v4) · 상품 상세가 같이 쓴다.
 *
 *   판매중 상품   가격 · 옵션은 서버(/api/products). 여기는 그림 · 영문 이름 · 스티커 문구만 (상품 id 로 찾는다)
 *   출시 예정     서버에 아직 없는 제품 — 메인 라인업에서 아래로부터 올라오고, 누르면 /lineup/:slug 미리 보기
 *
 * 제품이 늘면: 서버에 등록한 뒤 SELLING 에 id 로 한 항목, 아직 안 팔면 UPCOMING 에 한 항목.
 * 효능 · 건강 주장 문구는 넣지 않는다 (식품).
 */

export interface PouchPhotos {
  /** 몸에 딱 맞게 자른 투명 사진 (메인 흐름 · 상세 무대) — 가로:세로 ≈ 0.56 */
  front: string
  left: string
  right: string
  /** 정사각 사진 (카드 · 장바구니) */
  square: string
}

export interface SellingInfo {
  en: string
  spec: string
  photos: PouchPhotos
  points: string[]
}

/** 라인업 맨 앞 · 출시 예정 화면의 "지금 파는 제품" 링크 */
export const MAIN_PRODUCT_ID = 1

export const SELLING: Record<number, SellingInfo> = {
  // 1 = V5 의 "돌돌 제주산 100% NFC 레드비트즙"
  1: {
    en: 'RED BEET',
    spec: '120ml 파우치 · 30포 / 60포',
    photos: {
      front: '/products/beet/cut-front.webp',
      left: '/products/beet/cut-left.webp',
      right: '/products/beet/cut-right.webp',
      square: '/products/beet/pouch-front.webp',
    },
    points: ['비트 100%', '제주산 비트', '120ml 한 포'],
  },
}

export type ArtKind = 'bottle' | 'jar'

export interface UpcomingProduct {
  slug: string
  name: string
  en: string
  spec: string
  art: ArtKind
  desc: string
  points: string[]
}

export const UPCOMING: UpcomingProduct[] = [
  {
    slug: 'extract',
    name: '돌돌 비트 농축액',
    en: 'BEET EXTRACT',
    spec: '500ml 유리병',
    art: 'bottle',
    desc: '비트를 진하게 졸여 담은 농축액. 물이나 탄산수에 타서, 요리에 한 스푼.',
    points: ['비트 농축', '물에 타서 · 요리에', '500ml 유리병'],
  },
  {
    slug: 'powder',
    name: '돌돌 비트 파우더',
    en: 'BEET POWDER',
    spec: '150g 유리병',
    art: 'jar',
    desc: '비트를 말려 곱게 간 가루. 요거트 · 스무디 · 베이킹에 붉은 색을 한 스푼.',
    points: ['비트 100%', '스무디 · 베이킹', '150g 유리병'],
  },
]

export const upcomingBySlug = (slug: string | undefined) => UPCOMING.find((p) => p.slug === slug)

/** 상품 사진 — 관리자가 올린 사진이 먼저, 없으면 라인업 정사각 사진 */
export function productImageSrc(productId: number, imageUrl: string | null): string | null {
  return imageUrl ?? SELLING[productId]?.photos.square ?? null
}
